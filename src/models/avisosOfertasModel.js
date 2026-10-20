/**
 * Model — avisos por distancia (G06). Lógica pura, sin React ni red, para
 * usarla igual en la web y en la app y probarla con node --test.
 * - debeConsultar: throttle de /v1/ofertas/cerca (cada 30 s o 50 m).
 * - filtrarNuevos: un aviso por nivel y restaurante; si ya se avisó un nivel
 *   mejor (más cerca), no se avisa uno peor.
 * - leerVistos / guardarVistos: lo ya avisado, solo hoy (no se guarda ninguna
 *   posición, solo "restaurante:nivel").
 * - soloAvisables (G11): solo restaurantes partner o en favoritos del usuario.
 */
export const CLAVE_VISTOS = 'mira:avisosOfertas';
// Copia de los favoritos para filtrar avisos (la tarea en segundo plano no tiene React).
export const CLAVE_FAVS_AVISOS = 'mira:favoritosAvisos';

/** G11: avisar solo si el restaurante es partner o está en favoritos. */
export function soloAvisables(resultados, favoritos) {
  const favs = new Set((favoritos || []).map(String));
  return (resultados || []).filter((r) => r?.restaurante?.partner === true || favs.has(String(r?.restaurante?.id)));
}

export function leerFavoritosAvisos(storage) {
  try {
    const d = JSON.parse(storage?.getItem(CLAVE_FAVS_AVISOS) || '[]');
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}
export const INTERVALO_MS = 30_000;
export const DISTANCIA_M = 50;

/** Distancia en metros entre dos { lat, lng } (haversine). */
export function distanciaM(a, b) {
  const R = 6371000;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** ¿Toca consultar? Sí si nunca se consultó, pasaron 30 s o te moviste 50 m. */
export function debeConsultar(ultima, posicion, ahora = Date.now()) {
  if (!posicion) return false;
  if (!ultima) return true;
  return ahora - ultima.t >= INTERVALO_MS || distanciaM(ultima, posicion) >= DISTANCIA_M;
}

const clave = (restauranteId, nivel) => `${restauranteId}:${nivel}`;

/**
 * Identificador del aviso: restaurante + oferta + su última edición. Si el
 * restaurante cambia o edita la oferta, vuelve a avisar el mismo día.
 * Sin «:» (separa el nivel en las claves).
 */
export function idAviso(r) {
  const id = r?.restaurante?.id;
  if (!id) return null;
  const oferta = r?.oferta?.id;
  if (!oferta) return String(id);
  const editada = Date.parse(r.oferta.actualizado || r.oferta.creado || '');
  return `${id}~${oferta}${Number.isFinite(editada) ? `~${editada}` : ''}`;
}

/**
 * Resultados de /v1/ofertas/cerca → avisos nuevos (y el conjunto de vistos
 * actualizado). Niveles: 1000 > 500 > 100 > 20 (menor distancia = mejor).
 */
export function filtrarNuevos(resultados, vistos, limite = Infinity) {
  const siguiente = new Set(vistos);
  const nuevos = [];
  for (const r of resultados || []) {
    if (nuevos.length >= limite) break;
    const id = idAviso(r);
    const nivel = r?.nivel?.distancia;
    if (!id || !Number.isFinite(nivel)) continue;
    // Ya avisado este nivel o uno mejor (más cercano) para este restaurante.
    const yaMejor = [...siguiente].some((k) => {
      const [rid, n] = k.split(':');
      return rid === String(id) && Number(n) <= nivel;
    });
    if (yaMejor) continue;
    siguiente.add(clave(id, nivel));
    nuevos.push(r);
  }
  return { nuevos, vistos: siguiente };
}

function hoy(ahora) {
  const d = new Date(ahora);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Vistos de hoy (al cambiar de día se vuelve a avisar). */
export function leerVistos(storage, ahora = Date.now()) {
  try {
    const d = JSON.parse(storage?.getItem(CLAVE_VISTOS) || 'null');
    if (d && d.fecha === hoy(ahora) && Array.isArray(d.claves)) return new Set(d.claves);
  } catch { /* dato corrupto: se empieza de cero */ }
  return new Set();
}

export function guardarVistos(storage, vistos, ahora = Date.now()) {
  try {
    storage?.setItem(CLAVE_VISTOS, JSON.stringify({ fecha: hoy(ahora), claves: [...vistos] }));
  } catch { /* almacenamiento lleno o bloqueado */ }
}
