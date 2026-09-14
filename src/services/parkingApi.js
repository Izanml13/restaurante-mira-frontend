/**
 * Parkings cercanos vía Overpass API (amenity=parking, radio 500m).
 * Caché localStorage 48h, timeout 8s, orden por distancia, máx 10.
 */
import { haversineKm } from '../models/restaurantModel.js';

const TTL_MS = 48 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

function claveCache(lat, lng) {
  return `parkings_${Number(lat).toFixed(4)}_${Number(lng).toFixed(4)}`;
}

function leerCache(lat, lng) {
  try {
    const raw = localStorage.getItem(claveCache(lat, lng));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.t !== 'number' || !Array.isArray(parsed.data)) return null;
    if (Date.now() - parsed.t > TTL_MS) {
      localStorage.removeItem(claveCache(lat, lng));
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function guardarCache(lat, lng, data) {
  try {
    localStorage.setItem(claveCache(lat, lng), JSON.stringify({ t: Date.now(), data }));
  } catch {
    // quota excedida -> ignorar
  }
}

function construirUrl(lat, lng) {
  const query = `[out:json][timeout:10];(node["amenity"="parking"](around:500,${lat},${lng});way["amenity"="parking"](around:500,${lat},${lng}););out center tags;`;
  return `${OVERPASS_URL}?data=${encodeURIComponent(query)}`;
}

function normalizarElemento(el, latOrigen, lngOrigen) {
  const plat = el.lat ?? el.center?.lat;
  const plng = el.lon ?? el.center?.lon;
  if (typeof plat !== 'number' || typeof plng !== 'number') return null;
  const tags = el.tags || {};
  const distanciaM = Math.round(haversineKm(latOrigen, lngOrigen, plat, plng) * 1000);
  let gratuito = null;
  if (tags.fee === 'yes') gratuito = 'yes';
  else if (tags.fee === 'no') gratuito = 'no';
  const plazas = tags.capacity != null && String(tags.capacity).trim() !== '' ? Number(tags.capacity) : null;
  return {
    id: String(el.id),
    nombre: (tags.name && String(tags.name).trim()) || 'Parking',
    lat: plat,
    lng: plng,
    gratuito,
    plazas: Number.isFinite(plazas) ? plazas : null,
    horario: tags.opening_hours || null,
    distanciaM,
  };
}

/**
 * Parkings cercanos (≤500m) ordenados por distancia.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<Array<{id:string,nombre:string,lat:number,lng:number,gratuito:string|null,plazas:number|null,horario:string|null,distanciaM:number}>>}
 */
export async function fetchNearbyParkings(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) return [];

  const cached = leerCache(lat, lng);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(construirUrl(lat, lng), { signal: controller.signal });
    if (!res.ok) return [];
    const json = await res.json();
    const elements = Array.isArray(json.elements) ? json.elements : [];
    const lista = elements
      .map((el) => normalizarElemento(el, lat, lng))
      .filter(Boolean)
      .sort((a, b) => a.distanciaM - b.distanciaM)
      .slice(0, 10);
    guardarCache(lat, lng, lista);
    return lista;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
