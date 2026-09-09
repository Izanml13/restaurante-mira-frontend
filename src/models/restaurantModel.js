/**
 * Model — tipos del dominio (JSDoc, sin JSX ni lógica de UI).
 *
 * @typedef {Object} Resena
 * @property {string} usuario
 * @property {string} fecha - YYYY-MM-DD
 * @property {string} comentario
 * @property {number} puntuacion - 1 a 5
 *
 * @typedef {Object} Restaurant
 * @property {number|string} id
 * @property {string} nombre
 * @property {string} cocina - primera categoría (filtro rápido)
 * @property {string[]} [categorias] - todas las categorías
 * @property {string} precio - '€' | '€€' | '€€€'
 * @property {number|null} distanciaKm - null sin ubicación
 * @property {{lat:number,lng:number}|null} [coords]
 * @property {number} valoracion - 0 a 5 (nota Yelp)
 * @property {number} [totalResenasYelp]
 * @property {string} imagen
 * @property {string} descripcion - una línea
 * @property {string} [direccion]
 * @property {string} [ciudad]
 * @property {string} [zona] - zona de búsqueda (p. ej. 'Tarragona, Spain')
 * @property {string} [telefono]
 * @property {string} [yelpUrl]
 * @property {Resena[]} [resenas]
 */

/** Cocinas disponibles en el filtro (orden de la carta). */
export const COCINAS = [
  'Mediterránea',
  'Española',
  'Italiana',
  'Japonesa',
  'Mexicana',
  'Asador',
  'Fusión',
  'Vegana',
];

/** Precios disponibles en el filtro. */
export const PRECIOS = ['€', '€€', '€€€'];

/**
 * Tramos de distancia del filtro.
 * value '' = sin filtro.
 */
export const DISTANCIAS = [
  { value: '', label: 'Cualquier distancia' },
  { value: 1, label: 'A menos de 1 km' },
  { value: 3, label: 'A menos de 3 km' },
  { value: 5, label: 'A menos de 5 km' },
  { value: 10, label: 'A menos de 10 km' },
];

/** Criterios de ordenación del filtro. */
export const ORDENES = ['Relevancia', 'Valoración', 'Distancia', 'Precio'];

/**
 * Normaliza texto para búsqueda insensible a tildes y mayúsculas.
 * @param {string} str
 * @returns {string}
 */
export function normalizeText(str) {
  return (str ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Convierte '€€€' → 3 para poder ordenar por precio.
 * @param {string} precio
 * @returns {number}
 */
export function precioANumero(precio) {
  return (precio ?? '').length;
}

/**
 * Nota media de las reseñas sintéticas (1 decimal). Null si no hay.
 * @param {import('./restaurantModel.js').Restaurant} r
 * @returns {number|null}
 */
export function mediaResenas(r) {
  const list = r.resenas ?? [];
  if (!list.length) return null;
  const suma = list.reduce((acc, x) => acc + (Number(x.puntuacion) || 0), 0);
  return Math.round((suma / list.length) * 10) / 10;
}

/**
 * Color de acento estable por cocina (para cards dinámicas).
 * @param {string} cocina
 * @returns {string} color hex
 */
export function acentoCocina(cocina) {
  const PALETA = ['#E6A030', '#C0392B', '#2E7D5B', '#3E6B8C', '#7A4E9E', '#B0722A'];
  let h = 0;
  for (const ch of (cocina || '?').toLowerCase()) h = (h * 31 + ch.codePointAt(0)) % 997;
  return PALETA[h % PALETA.length];
}

/**
 * Distancia en km entre dos puntos (fórmula de Haversine).
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number}
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
