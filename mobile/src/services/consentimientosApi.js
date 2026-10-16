/**
 * Service — consentimientos de ubicación y notificaciones en la app (C02).
 * Igual que en la web: dispositivo (localStorage, que en la app es el shim
 * sobre AsyncStorage) y, con sesión, perfil (`PUT /v1/users/me` → consentimientos, C01).
 * Las pantallas se suscriben con suscribirConsentimientos() para releer.
 */
import { api } from './httpClient.js';
import { leer, escribir, decidir, fusionar, TIPOS } from '../models/consentimientosModel.js';

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

/** Al iniciar sesión: gana la decisión más reciente entre dispositivo y perfil. */
export async function sincronizarConsentimientos() {
  let remoto = {};
  try { remoto = (await api.get('/v1/users/me'))?.consentimientos || {}; } catch { return; }
  const { aLocal, aPerfil } = fusionar(leerConsentimientos(), remoto);
  for (const [tipo, valor] of Object.entries(aLocal)) escribir(globalThis.localStorage, tipo, valor);
  if (Object.keys(aLocal).length) avisar();
  await subir(aPerfil);
}
