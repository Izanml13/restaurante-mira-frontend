/**
 * Service — consentimientos de ubicación y notificaciones (C02).
 * Se guardan en el dispositivo (consentimientosModel) y, con sesión, en el
 * perfil (`PUT /v1/users/me` → consentimientos, C01). Si la API aún no conoce
 * el campo, el perfil falla en silencio y el dispositivo sigue mandando.
 */
import { api } from './httpClient.js';
import { leer, escribir, decidir, sincronizar, TIPOS } from '../models/consentimientosModel.js';

/** Evento para que todas las pantallas relean (useUbicacion ya escucha 'mira:ubicacion'). */
export const EVENTO = 'mira:consentimientos';

function almacenamiento() {
  try { return window.localStorage; } catch { return null; }
}

function avisar() {
  window.dispatchEvent(new Event(EVENTO));
  window.dispatchEvent(new Event('mira:ubicacion'));
}

export function leerConsentimientos() {
  const s = almacenamiento();
  return Object.fromEntries(TIPOS.map((t) => [t, leer(s, t)]));
}

async function subir(consentimientos) {
  if (!Object.keys(consentimientos).length) return;
  try {
    await api.put('/v1/users/me', { consentimientos });
  } catch { /* sin sesión o API sin C01: queda en el dispositivo */ }
}

/** Decisión del usuario: dispositivo al momento y perfil si hay sesión. */
export async function decidirConsentimiento(tipo, estado) {
  const valor = decidir(almacenamiento(), tipo, estado);
  avisar();
  await subir({ [tipo]: valor });
  return valor;
}

async function uidActual() {
  try {
    const { getAuth } = await import('firebase/auth');
    const { getFirebaseApp } = await import('./firebase.js');
    return getAuth(getFirebaseApp()).currentUser?.uid || null;
  } catch { return null; }
}

/**
 * Al iniciar sesión: gana la decisión más reciente entre dispositivo y perfil.
 * Ligada a la sesión `uid`: si mientras tanto se sale o se cambia de cuenta (o
 * `sigueVigente()` devuelve false), no aplica ni sube nada. Devuelve true si terminó vigente.
 */
export async function sincronizarConsentimientos(uid, sigueVigente = () => true) {
  let actual = uid;
  const vigente = () => Boolean(uid) && actual === uid && sigueVigente();
  const s = almacenamiento();
  return sincronizar({
    leerRemoto: async () => {
      const remoto = (await api.get('/v1/users/me'))?.consentimientos || {};
      actual = await uidActual();
      return remoto;
    },
    leerLocal: leerConsentimientos,
    escribirLocal: (tipo, valor) => { escribir(s, tipo, valor); avisar(); },
    subir: async (c) => { actual = await uidActual(); if (vigente()) await subir(c); },
    sigueVigente: vigente,
  });
}
