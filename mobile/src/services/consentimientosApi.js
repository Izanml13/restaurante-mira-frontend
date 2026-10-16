/**
 * Service — consentimientos de ubicación y notificaciones en la app (C02).
 * Igual que en la web: dispositivo (localStorage, que en la app es el shim
 * sobre AsyncStorage) y, con sesión, perfil (`PUT /v1/users/me` → consentimientos, C01).
 * Las pantallas se suscriben con suscribirConsentimientos() para releer.
 */
import { api } from './httpClient.js';
import { leer, escribir, decidir, sincronizar, TIPOS } from '../models/consentimientosModel.js';

const oyentes = new Set();

/** Devuelve la función para darse de baja. */
export function suscribirConsentimientos(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

function avisar() {
  for (const fn of oyentes) fn();
}

export function leerConsentimientos() {
  return Object.fromEntries(TIPOS.map((t) => [t, leer(globalThis.localStorage, t)]));
}

async function subir(consentimientos) {
  if (!Object.keys(consentimientos).length) return;
  try {
    await api.put('/v1/users/me', { consentimientos });
  } catch { /* sin sesión o API sin C01: queda en el dispositivo */ }
}

export async function decidirConsentimiento(tipo, estado) {
  const valor = decidir(globalThis.localStorage, tipo, estado);
  avisar();
  await subir({ [tipo]: valor });
  return valor;
}

async function uidActual() {
  try {
    const { getFirebaseAuth } = await import('./firebase.js');
    return getFirebaseAuth().currentUser?.uid || null;
  } catch { return null; }
}

/**
 * Al iniciar sesión: gana la decisión más reciente entre dispositivo y perfil.
 * Ligada a la sesión `uid` (revisión de Codex): si mientras tanto se sale o se
 * cambia de cuenta, no aplica ni sube nada. Devuelve true si terminó vigente.
 */
export async function sincronizarConsentimientos(uid, sigueVigente = () => true) {
  let actual = uid;
  const vigente = () => Boolean(uid) && actual === uid && sigueVigente();
  return sincronizar({
    leerRemoto: async () => {
      const remoto = (await api.get('/v1/users/me'))?.consentimientos || {};
      actual = await uidActual();
      return remoto;
    },
    leerLocal: leerConsentimientos,
    escribirLocal: (tipo, valor) => { escribir(globalThis.localStorage, tipo, valor); avisar(); },
    subir: async (c) => { actual = await uidActual(); if (vigente()) await subir(c); },
    sigueVigente: vigente,
  });
}
