/**
 * Parkings cercanos con Overpass API (OpenStreetMap, gratis, sin clave).
 * Caché en memoria por coordenadas. Si falla, devuelve [] y la app
 * sigue funcionando sin parkings. 0 lecturas de Firestore.
 *
 * Nota CORS: en navegador el User-Agent lo pone el propio navegador
 * (no se puede fijar por fetch - header prohibido). En Node sí se fija.
 * Overpass exige GET + Accept en overpass-api.de; POST da 406 sin UA.
 */

const CACHE = new Map();

// Endpoints por orden (se prueba el siguiente si el anterior falla/504/429)
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
];

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function nombreParking(tags) {
  if (!tags) return 'Parking';
  return (
    tags.name ||
    tags.operator ||
    (tags['addr:street'] ? `Parking ${tags['addr:street']}` : null) ||
    (tags.parking ? `Parking (${tags.parking})` : 'Parking')
  );
}

/**
 * @param {number} lat
 * @param {number} lng
 * @param {{ radio?: number, limite?: number }} opts radio en metros (def 1000)
 * @returns {Promise<{ id:string, lat:number, lng:number, nombre:string, distanciaM:number }[]>}
 */
export async function buscarParkingsCercanos(lat, lng, { radio = 1000, limite = 5 } = {}) {
  if (lat == null || lng == null) return [];
  const clave = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)},${radio},${limite}`;
  if (!CACHE.has(clave)) {
    CACHE.set(clave, consultarConFallback(lat, lng, radio, limite));
  }
  try {
    return await CACHE.get(clave);
  } catch {
    CACHE.delete(clave);
    return [];
  }
}

async function consultarConFallback(lat, lng, radio, limite) {
  // Radios progresivos: si no hay nada a 1km, se abre a 2km y 3km antes de rendirse.
  // En pueblos OSM tiene pocos parkings mapeados y el radio corto daba vacío siempre.
  const radios = radio < 1000 ? [radio, 1200, 2000] : radio <= 1500 ? [radio, 2000, 3000] : [radio];
  let ultimo = [];
  for (const r of radios) {
    const res = await consultarOverpass(lat, lng, r, limite);
    if (res.length > 0) return res;
    ultimo = res;
  }
  return ultimo;
}

async function consultarOverpass(lat, lng, radio, limite) {
  // Búsqueda amplia: amenity=parking + parking_space + cualquier objeto con tag parking=*.
  // Antes solo amenity="parking" y se perdían parkings subterráneos, parkings privados
  // mapeados como parking_space y aparcamientos disuasorios.
  const ql = `[out:json][timeout:25];(nwr["amenity"~"^(parking|parking_space)$"](around:${radio},${lat},${lng});nwr["parking"](around:${radio},${lat},${lng}););out center ${Math.min(40, limite * 8)};`;
  const qs = `data=${encodeURIComponent(ql)}`;
  for (const base of ENDPOINTS) {
    const url = `${base}?${qs}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: ctrl.signal,
      });
      if (res.status === 429 || res.status === 504) {
        // probar siguiente espejo
        continue;
      }
      if (!res.ok) continue;
      const text = await res.text();
      // Overpass a veces devuelve XML de error aunque status 200: detectarlo
      if (text.trim().startsWith('<')) continue;
      const json = JSON.parse(text);
      const els = Array.isArray(json.elements) ? json.elements : [];
      const parkings = els
        .map((e) => {
          const plat = e.lat ?? e.center?.lat;
          const plng = e.lon ?? e.center?.lon;
          if (plat == null || plng == null) return null;
          return {
            id: `osm-${e.type}-${e.id}`,
            lat: plat,
            lng: plng,
            nombre: nombreParking(e.tags),
            distanciaM: Math.round(haversineM(lat, lng, plat, plng)),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distanciaM - b.distanciaM)
        .slice(0, limite);
      return parkings;
    } catch {
      // timeout/CORS/network: probar siguiente espejo
      continue;
    } finally {
      clearTimeout(t);
    }
  }
  return [];
}

/**
 * Alias para RestaurantDetail: busca parkings cercanos (≤radio, defecto 1500m).
 * Wrapper de buscarParkingsCercanos con la interfaz que espera el componente.
 */
export async function fetchNearbyParkings(lat, lng, radio = 1500) {
  return buscarParkingsCercanos(lat, lng, { radio, limite: 10 });
}

/** Texto corto "a 150 m" / "a 1,2 km". */
export function formatoDistancia(m) {
  if (m == null) return '';
  if (m < 1000) return `a ${m} m`;
  return `a ${(m / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} km`;
}

/** Enlace Google Maps a un punto. */
export function mapsLink(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Búsqueda de parkings en Google Maps alrededor del restaurante (fallback cuando OSM va vacío). */
export function buscarParkingEnGoogle(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=parking+near+${lat},${lng}`;
}
