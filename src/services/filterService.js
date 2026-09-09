/**
 * Model — reglas de filtrado y ordenación (funciones puras, sin side-effects).
 */
import { normalizeText, precioANumero } from '../models/restaurantModel.js';

/**
 * Filtra la lista en cliente. Todos los filtros son opcionales.
 * @param {import('../models/restaurantModel.js').Restaurant[]} list
 * @param {{ q?: string, precio?: string, cocina?: string, zona?: string, distanciaMax?: number|string }} filters
 * @returns {import('../models/restaurantModel.js').Restaurant[]}
 */
export function filterRestaurants(list, { q = '', precio = '', cocina = '', zona = '', distanciaMax = '' } = {}) {
  const query = normalizeText(q).trim();
  const maxKm = distanciaMax === '' || distanciaMax == null ? null : Number(distanciaMax);

  return list.filter((r) => {
    if (precio && r.precio !== precio) return false;
    if (cocina && r.cocina !== cocina) return false;
    if (zona && (r.zona ?? '') !== zona) return false;
    if (maxKm != null && (r.distanciaKm == null || !(r.distanciaKm <= maxKm))) return false;
    if (query) {
      const haystack = normalizeText(`${r.nombre} ${r.cocina} ${r.descripcion}`);
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/**
 * Ordena una lista ya filtrada (devuelve copia nueva, no muta).
 * @param {import('../models/restaurantModel.js').Restaurant[]} list
 * @param {string} orden - uno de ORDENES
 * @returns {import('../models/restaurantModel.js').Restaurant[]}
 */
export function sortRestaurants(list, orden = 'Relevancia') {
  const copia = [...list];
  switch (orden) {
    case 'Valoración':
      return copia.sort((a, b) => b.valoracion - a.valoracion);
    case 'Distancia':
      // Sin distancia conocida van al final, nunca rompen el orden.
      return copia.sort((a, b) => (a.distanciaKm ?? Infinity) - (b.distanciaKm ?? Infinity));
    case 'Precio':
      return copia.sort((a, b) => precioANumero(a.precio) - precioANumero(b.precio));
    case 'Relevancia':
    default:
      return copia; // orden original de la carta
  }
}
