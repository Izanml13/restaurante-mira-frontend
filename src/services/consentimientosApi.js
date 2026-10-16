/**
 * Service — consentimientos de ubicación y notificaciones (C02).
 * Se guardan en el dispositivo (consentimientosModel) y, con sesión, en el
 * perfil (`PUT /v1/users/me` → consentimientos, C01). Si la API aún no conoce
 * el campo, el perfil falla en silencio y el dispositivo sigue mandando.
 */
import { api } from './httpClient.js';
import { leer, escribir, decidir, fusionar, TIPOS } from '../models/consentimientosModel.js';

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

/** Al iniciar sesión: gana la decisión más reciente entre dispositivo y perfil. */
export async function sincronizarConsentimientos() {
  let remoto = {};
  try { remoto = (await api.get('/v1/users/me'))?.consentimientos || {}; } catch { return; }
  const { aLocal, aPerfil } = fusionar(leerConsentimientos(), remoto);
  const s = almacenamiento();
  for (const [tipo, valor] of Object.entries(aLocal)) escribir(s, tipo, valor);
  if (Object.keys(aLocal).length) avisar();
  await subir(aPerfil);
}
