/**
 * Model — autenticación con Firebase Auth (email + contraseña).
 * No toca Firestore: crear cuentas e iniciar sesión no gasta lecturas.
 */
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
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
    default:
      return defecto;
  }
}

/**
 * Crea la cuenta, guarda el nombre visible y crea el perfil en `usuarios/{uid}`
 * (tipo 'cliente' o 'empresa'). 1 escritura extra, solo al registrarse.
 * @returns {Promise<{nombre:string,email:string}>}
 */
export async function crearCuenta({ nombre, email, password, tipo = 'cliente' }) {
  try {
    const cred = await createUserWithEmailAndPassword(auth(), email.trim(), password);
    await updateProfile(cred.user, { displayName: nombre.trim() });
    await guardarPerfil(cred.user.uid, {
      tipo: tipo === 'empresa' ? 'empresa' : 'cliente',
      nombre: nombre.trim(),
      email: cred.user.email,
    });
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
