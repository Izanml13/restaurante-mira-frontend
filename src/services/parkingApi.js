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
      if (res.status === 429 || res.status === 504) continue;
      if (!res.ok) continue;
      const text = await res.text();
      if (text.trim().startsWith('<')) continue;
      const json = JSON.parse(text);
      const els = Array.isArray(json.elements) ? json.elements : [];
      const parkings = els
        .map((e) => {
          const plat = e.lat ?? e.center?.lat;
          const plng = e.lon ?? e.center?.lon;
          if (plat == null || plng == null) return null;
          const tags = e.tags || {};
          const esSubterraneo = /underground|sotano|s\.?b\.?|basement/i.test(tags.parking || '');
          const esMultinivel = /multistorey|multi_storey|parkade/i.test(tags.parking || '');
          return {
            id: `osm-${e.type}-${e.id}`,
            lat: plat,
            lng: plng,
            nombre: nombreParking(tags),
            distanciaMetros: Math.round(haversineM(lat, lng, plat, plng)),
            gratuito: tags.fee === 'no' || tags['fee:conditional'] ? 'yes' : 'no',
            accesible: tags.wheelchair === 'yes' ? 'Sí' : '—',
            tipo: esSubterraneo ? 'Subterráneo' : esMultinivel ? 'Multinivel' : '—',
            direccion: [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ') || '',
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distanciaMetros - b.distanciaMetros)
        .slice(0, limite);
      return parkings;
    } catch {
      continue;
    } finally {
      clearTimeout(t);
    }
  }
  return [];
}

export async function fetchNearbyParkings(lat, lng, radio = 1500) {
  return buscarParkingsCercanos(lat, lng, { radio, limite: 10 });
}

export function formatoDistancia(m) {
  if (m == null) return '';
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} km`;
}

export function mapsLink(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function buscarParkingEnGoogle(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=parking+near+${lat},${lng}`;
}
