/**
 * Model — consentimientos RGPD de ubicación y notificaciones (C02).
 * Mismo formato en el dispositivo (localStorage) y en el perfil
 * (`usuarios/{uid}.consentimientos`, C01): { estado, version, fecha }.
 * La clave de ubicación es la misma que usa ubicacionModel (G03).
 * Si cambia el texto de un consentimiento, subir su versión: se vuelve a pedir.
 */
export const TIPOS = ['ubicacion', 'notificaciones'];
export const CLAVES = { ubicacion: 'mira:ubicacion', notificaciones: 'mira:notificaciones' };
export const VERSIONES = { ubicacion: 1, notificaciones: 1 };
const ESTADOS = ['aceptado', 'rechazado'];

/** Un consentimiento válido y de la versión actual, o null. */
export function normalizar(tipo, d) {
  if (!d || !ESTADOS.includes(d.estado) || d.version !== VERSIONES[tipo]) return null;
  const fecha = typeof d.fecha === 'string' && !Number.isNaN(Date.parse(d.fecha)) ? d.fecha : null;
  return fecha ? { estado: d.estado, version: d.version, fecha } : null;
}

export function leer(storage, tipo) {
  try { return normalizar(tipo, JSON.parse(storage?.getItem(CLAVES[tipo]) || 'null')); } catch { return null; }
}

export function escribir(storage, tipo, valor) {
  try { storage?.setItem(CLAVES[tipo], JSON.stringify(valor)); } catch { /* almacenamiento lleno o bloqueado */ }
  return valor;
}

/** Guarda una decisión nueva del usuario (sin coordenadas ni datos del dispositivo). */
export function decidir(storage, tipo, estado, ahora = new Date()) {
  if (!TIPOS.includes(tipo) || !ESTADOS.includes(estado)) throw new Error(`Consentimiento no válido: ${tipo}/${estado}`);
  return escribir(storage, tipo, { estado, version: VERSIONES[tipo], fecha: ahora.toISOString() });
}

/**
 * Dispositivo frente a perfil: gana el más reciente. Devuelve qué hay que
 * copiar: { aLocal, aPerfil } (cada uno, objeto por tipo o vacío).
 */
export function fusionar(local, remoto) {
  const aLocal = {};
  const aPerfil = {};
  for (const tipo of TIPOS) {
    const l = normalizar(tipo, local?.[tipo]);
    const r = normalizar(tipo, remoto?.[tipo]);
    if (l && (!r || Date.parse(l.fecha) > Date.parse(r.fecha))) aPerfil[tipo] = l;
    else if (r && (!l || Date.parse(r.fecha) > Date.parse(l.fecha))) aLocal[tipo] = r;
  }
  return { aLocal, aPerfil };
}

/** Primer paso del arranque que falta por decidir, o null si ya está todo. */
export function pasoPendiente({ cookiesDecididas, ubicacion, notificaciones }) {
  if (!cookiesDecididas) return 'cookies';
  if (!ubicacion) return 'ubicacion';
  if (!notificaciones) return 'notificaciones';
  return null;
}

/**
 * Sincronización con el perfil ligada a una sesión (C02, revisión de Codex):
 * `sigueVigente()` debe devolver false si se cerró sesión o se cambió de cuenta.
 * Se comprueba después del GET y antes de cada escritura, para no mezclar los
 * consentimientos de la cuenta anterior con el dispositivo ni subirlos con el
 * Bearer de la nueva. Devuelve true si llegó al final con la sesión vigente.
 */
export async function sincronizar({ leerRemoto, leerLocal, escribirLocal, subir, sigueVigente }) {
  if (!sigueVigente()) return false;
  let remoto;
  try { remoto = await leerRemoto(); } catch { return false; }
  if (!sigueVigente()) return false;
  const { aLocal, aPerfil } = fusionar(leerLocal(), remoto || {});
  for (const [tipo, valor] of Object.entries(aLocal)) escribirLocal(tipo, valor);
  if (Object.keys(aPerfil).length) {
    if (!sigueVigente()) return false;
    await subir(aPerfil);
  }
  return sigueVigente();
}
