/**
 * Web Push (T07): notificaciones en la PWA (iPhone 16.4+ instalada, Android y
 * ordenador) con Firebase Cloud Messaging sobre nuestro /sw.js.
 * - activarPush(lang): SOLO desde un clic (iOS lo exige). Pide permiso, saca el
 *   token FCM y lo registra en POST /v1/push/tokens (tipo "web").
 * - desactivarPush(): DELETE /v1/push/tokens/:id (al cerrar sesión o al apagar).
 * - estadoPush(): 'no-soportado' | 'instalar-ios' | 'sin-clave' | 'bloqueado' | 'activo' | 'inactivo'.
 */
import { getMessaging, getToken, deleteToken, isSupported } from 'firebase/messaging';
import { getFirebaseApp } from './firebase.js';
import { api } from './httpClient.js';

const VAPID = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
const LS_ID = 'mira:pushWebId';

function leerId() {
  try { return localStorage.getItem(LS_ID); } catch { return null; }
}
function guardarId(id) {
  try { id ? localStorage.setItem(LS_ID, id) : localStorage.removeItem(LS_ID); } catch { /* sin storage */ }
}

export function esIOS() {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function esInstalada() {
  return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
}

function plataforma() {
  if (esIOS()) return 'ios';
  return /Android/i.test(navigator.userAgent || '') ? 'android' : 'web';
}

export async function estadoPush() {
  // En iPhone, Web Push solo existe con la web instalada en la pantalla de inicio.
  if (esIOS() && !esInstalada()) return 'instalar-ios';
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !(await isSupported().catch(() => false))) {
    return 'no-soportado';
  }
  if (!VAPID) return 'sin-clave';
  if (Notification.permission === 'denied') return 'bloqueado';
  return Notification.permission === 'granted' && leerId() ? 'activo' : 'inactivo';
}

async function registroSW() {
  return (await navigator.serviceWorker.getRegistration('/')) || navigator.serviceWorker.register('/sw.js');
}

export async function activarPush(lang = 'es') {
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return { ok: false, motivo: permiso === 'denied' ? 'bloqueado' : 'cancelado' };
  const serviceWorkerRegistration = await registroSW();
  const token = await getToken(getMessaging(getFirebaseApp()), { vapidKey: VAPID, serviceWorkerRegistration });
  if (!token) return { ok: false, motivo: 'sin-token' };
  const idioma = ['es', 'ca', 'en'].includes(lang) ? lang : 'es';
  const r = await api.post('/v1/push/tokens', { token, tipo: 'web', plataforma: plataforma(), idioma });
  guardarId(r?.id || null);
  return { ok: Boolean(r?.id) };
}

/** Borra el registro en la API (antes de invalidar el Bearer) y el token local. */
export async function desactivarPush() {
  const id = leerId();
  guardarId(null);
  try {
    if (id) await api.del(`/v1/push/tokens/${encodeURIComponent(id)}`);
  } catch (e) {
    console.warn('[MIRA push] No se pudo borrar el token web:', e?.message || e);
  }
  try {
    if (await isSupported()) await deleteToken(getMessaging(getFirebaseApp()));
  } catch { /* sin token que borrar */ }
}

/* ── Preferencias por categoría (T10) ── */
export function leerPreferenciasPush() {
  return api.get('/v1/push/preferencias');
}
export function guardarPreferenciaPush(cambio) {
  return api.put('/v1/push/preferencias', cambio);
}
