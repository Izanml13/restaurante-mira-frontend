/**
 * Model — autenticación con Firebase Auth (email + contraseña).
 * Recuperación de contraseña y 2FA (MFA SMS) incluidos.
 */
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  verifyPasswordResetCode,
  confirmPasswordReset,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  getMultiFactorResolver,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { getFirebaseApp } from './firebase.js';
import { guardarPerfil } from './perfilApi.js';

function auth() {
  return getAuth(getFirebaseApp());
}

function mensajeError(code, defecto) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Ese correo ya tiene cuenta. Prueba a iniciar sesión.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/invalid-email':
      return 'Ese correo no parece válido.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera unos minutos y prueba de nuevo.';
    case 'auth/user-disabled':
      return 'Ese usuario está deshabilitado.';
    case 'auth/reset-password-too-many-requests':
      return 'Demasiadas peticiones de recuperación. Espera unos minutos.';
    case 'auth/expired-action-code':
      return 'Enlace caducado, pide otro.';
    case 'auth/invalid-action-code':
      return 'Enlace inválido o ya usado. Pide otro.';
    default:
      return defecto;
  }
}

/** URL de continuación tras el reset: la que Firebase usa en el enlace del email. */
export function urlContinuacionReset() {
  return 'https://restaurante-mira-frontend.vercel.app/#/restablecer';
}

/**
 * Crea la cuenta, guarda el nombre visible y crea el perfil en `usuarios/{uid}`
 * (tipo 'cliente' o 'empresa'). 1 escritura extra, solo al registrarse.
 * @returns {Promise<{nombre:string,email:string}>}
 */
export async function crearCuenta({ nombre, email, password, tipo = 'cliente', preferencias, accesibilidad }) {
  try {
    const cred = await createUserWithEmailAndPassword(auth(), email.trim(), password);
    await updateProfile(cred.user, { displayName: nombre.trim() });
    const perfil = {
      tipo: tipo === 'empresa' ? 'empresa' : 'cliente',
      nombre: nombre.trim(),
      email: cred.user.email,
    };
    if (preferencias) perfil.preferencias = preferencias;
    if (accesibilidad) perfil.accesibilidad = accesibilidad;
    await guardarPerfil(cred.user.uid, perfil);
    sendEmailVerification(cred.user, { url: urlContinuacionReset() }).catch(() => {});
    return { nombre: nombre.trim(), email: cred.user.email };
  } catch (e) {
    throw new Error(mensajeError(e.code, 'No se pudo crear la cuenta. Inténtalo de nuevo.'));
  }
}

/** @returns {Promise<{nombre:string,email:string}>} */
export async function iniciarSesion({ email, password }) {
  try {
    const cred = await signInWithEmailAndPassword(auth(), email.trim(), password);
    return { nombre: cred.user.displayName || '', email: cred.user.email };
  } catch (e) {
    throw new Error(mensajeError(e.code, 'No se pudo iniciar sesión. Inténtalo de nuevo.'));
  }
}

/** Envía email de recuperación de contraseña (gratis, 0 coste). No revela si el email existe. */
export async function recuperarContrasena(email) {
  const limpio = email.trim();
  try {
    await sendPasswordResetEmail(auth(), limpio, {
      url: urlContinuacionReset(),
      handleCodeInApp: false,
    });
  } catch (e) {
    // No revelar existencia: email inexistente se trata como éxito.
    if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') return;
    throw new Error(mensajeError(e.code, 'No se pudo enviar el correo de recuperación.'));
  }
}

/**
 * Verifica el oobCode del enlace y devuelve el email asociado.
 * Lanza Error con mensaje en español (caducado / inválido).
 */
export async function verificarCodigoReset(oobCode) {
  try {
    return await verifyPasswordResetCode(auth(), oobCode);
  } catch (e) {
    throw new Error(mensajeError(e.code, 'Enlace inválido o caducado. Pide otro.'));
  }
}

/** Confirma la nueva contraseña con el oobCode. Mensajes en español. */
export async function confirmarNuevaContrasena(oobCode, nuevaPassword) {
  try {
    await confirmPasswordReset(auth(), oobCode, nuevaPassword);
  } catch (e) {
    throw new Error(mensajeError(e.code, 'No se pudo cambiar la contraseña. Pide otro enlace.'));
  }
}

/** Enmascara un email: "maria@gmail.com" -> "m•••@gmail.com". */
export function enmascararEmail(email) {
  const [local = '', dominio = ''] = String(email || '').split('@');
  if (!dominio) return 'tu correo';
  const inicial = local.charAt(0) || '•';
  return `${inicial}•••@${dominio}`;
}

/**
 * Extrae el oobCode llegue como llegue:
 * - Handler personalizado con hash: #/restablecer?mode=resetPassword&oobCode=XXX
 * - Handler personalizado sin hash: ?oobCode=XXX (search)
 * - Links de Firebase con ?mode=&oobCode= en search
 */
export function extraerOobCode() {
  try {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const qHash = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
    for (const qs of [qHash, search.replace(/^\?/, '')]) {
      if (!qs) continue;
      const params = new URLSearchParams(qs);
      const code = params.get('oobCode');
      if (code) return code;
    }
  } catch {
    /* sin oobCode */
  }
  return '';
}

export function cerrarSesion() {
  return signOut(auth());
}

/** Suscribe a los cambios de sesión. Devuelve función para desuscribir. */
export function suscribirSesion(callback) {
  return onAuthStateChanged(auth(), (u) =>
    callback(
      u
        ? { uid: u.uid, nombre: u.displayName || '', email: u.email ?? '', creado: u.metadata?.creationTime ?? null }
        : null,
    ),
  );
}

// =====================================================
// 2FA — MFA SMS con Firebase (gratis: 10k SMS/mes)
// =====================================================

let recaptchaVerifier = null;

function getRecaptcha(containerId) {
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch { /* ya destruido */ }
  }
  recaptchaVerifier = new RecaptchaVerifier(auth(), containerId, { size: 'invisible' });
  return recaptchaVerifier;
}

/**
 * Enlaza un teléfono al usuario actual (requiere 2FA SMS).
 * 1. Envia un SMS con código al teléfono.
 * 2. El usuario introduce el código → se enlaza al multiFactor.
 * @returns {{ verificationId: string }} — llévalo a enrollMfa2
 */
export async function enviarCodigoMfa(phoneNumber, containerId) {
  const recaptcha = getRecaptcha(containerId);
  const session = multiFactor(auth().currentUser).session;
  const phoneInfoOptions = { phoneNumber, session, recaptcha };
  const provider = new PhoneAuthProvider(auth());
  const verificationId = await provider.verifyPhoneNumber(phoneInfoOptions, recaptcha);
  return { verificationId };
}

/**
 * Confirma el código SMS y completa el enrollment de 2FA.
 * @param {string} verificationId
 * @param {string} verificationCode - código de 6 dígitos
 */
export async function enrollMfa(verificationId, verificationCode) {
  const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
  await multiFactor(auth().currentUser).enroll(multiFactorAssertion, 'SMS');
}

/**
 * Verifica 2FA durante el login: resuelve el resolver de MFA y comprueba el código.
 * @param {object} resolver - error.resolver del error multi-factor
 * @param {string} verificationId
 * @param {string} verificationCode
 */
export async function verificarMfaLogin(resolver, verificationId, verificationCode) {
  const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
  await getMultiFactorResolver(auth(), resolver).resolveSignIn(multiFactorAssertion);
}

/**
 * Comprueba si el usuario tiene 2FA activado.
 * @returns {boolean}
 */
export function tieneMfa() {
  const u = auth().currentUser;
  if (!u) return false;
  try {
    const factors = multiFactor(u).enrolledFactors;
    return factors && factors.length > 0;
  } catch {
    return false;
  }
}

/**
 * Inicia sesión y devuelve el error MFA si el usuario tiene 2FA activo.
 * La UI debe gestionar el flujo: si es MFA → mostrar input de código SMS.
 * @returns {{ exito: boolean, mfaRequired?: object, error?: string }}
 */
export async function iniciarSesionConMfa({ email, password }) {
  try {
    await signInWithEmailAndPassword(auth(), email.trim(), password);
    return { exito: true };
  } catch (e) {
    if (e.code === 'auth/multi-factor-auth-required') {
      return { exito: false, mfaRequired: e.resolver };
    }
    throw new Error(mensajeError(e.code, 'No se pudo iniciar sesión.'));
  }
}
