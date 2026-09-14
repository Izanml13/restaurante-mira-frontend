/**
 * Service — cookies: consentimiento guardado en localStorage (invitado)
 * y en Firestore `usuarios/{uid}.consentimientoCookies` (logueado).
 * Categorías: necesarias, preferencias, analiticas, marketing.
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from './firebase.js';

const LS_CONSENT = 'mira:cookies';

export const COOKIE_CATEGORIAS = [
  { key: 'necesarias', label: 'Necesarias', desc: 'Imprescindibles para que la web funcione (sesión, carrito, cookies). No se pueden desactivar.', requerida: true },
  { key: 'preferencias', label: 'Preferencias', desc: 'Recuerdan tu tema (claro/oscuro), filtros y ajustes de la web.' },
  { key: 'analiticas', label: 'Analíticas', desc: 'Nos ayudan a entender qué páginas visitas y cómo usas la web para mejorarla.' },
  { key: 'marketing', label: 'Marketing', desc: 'Permiten mostrarte publicidad relevante en otros sitios web.' },
];

export const COOKIE_DEFAULT = { necesarias: true, preferencias: false, analiticas: false, marketing: false };

/** Lee el consentimiento de cookies (localStorage o Firestore). */
export async function leerCookies(uid) {
  if (uid) {
    try {
      const snap = await getDoc(doc(getDb(), 'usuarios', uid));
      if (snap.exists() && snap.data().consentimientoCookies) {
        return snap.data().consentimientoCookies;
      }
    } catch { /* sin red: fallback a localStorage */ }
  }
  try {
    const raw = localStorage.getItem(LS_CONSENT);
    return raw ? JSON.parse(raw) : { ...COOKIE_DEFAULT, timestamp: null };
  } catch {
    return { ...COOKIE_DEFAULT, timestamp: null };
  }
}

/** Guarda el consentimiento de cookies (localStorage siempre, Firestore si logueado). */
export async function guardarCookies(consentimiento, uid) {
  const datos = { ...consentimiento, timestamp: new Date().toISOString() };
  try {
    localStorage.setItem(LS_CONSENT, JSON.stringify(datos));
  } catch { /* localStorage lleno */ }
  if (uid) {
    try {
      await setDoc(doc(getDb(), 'usuarios', uid), { consentimientoCookies: datos }, { merge: true });
    } catch { /* sin red: queda en localStorage */ }
  }
  return datos;
}

/** ¿El usuario dio consentimiento explícito (tiene timestamp)? */
export function tieneConsentimiento(cookies) {
  return cookies && typeof cookies.timestamp === 'string' && cookies.timestamp.length > 0;
}

/** ¿Esta categoría está activa? */
export function categoriaActiva(cookies, key) {
  if (!cookies) return key === 'necesarias';
  return Boolean(cookies[key]);
}
