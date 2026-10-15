/**
 * Punto más céntrico de cada ciudad (sin usar la ubicación del usuario).
 * Se usa para centrar el mapa por zona y como referencia de distancia.
 * Coordenadas: plazas centrales (Plaça Catalunya, Plaça de la Font,
 * Plaça Independència, Plaça de la Paeria).
 */
export const CENTRO_CATALUNA = { lat: 41.6, lng: 1.8, zoom: 8 };

export const CENTROS_CIUDAD = {
  'Barcelona, Spain': { lat: 41.3879, lng: 2.1699, zoom: 13, nombre: 'Barcelona' },
  'Tarragona, Spain': { lat: 41.1189, lng: 1.2445, zoom: 13, nombre: 'Tarragona' },
  'Girona, Spain': { lat: 41.9794, lng: 2.8214, zoom: 13, nombre: 'Girona' },
  'Lleida, Spain': { lat: 41.6148, lng: 0.6256, zoom: 13, nombre: 'Lleida' },
};

/**
 * Centro para una zona (o Cataluña si no hay coincidencia).
 * @param {string} zona
 */
export function centroDeZona(zona) {
  if (zona && CENTROS_CIUDAD[zona]) return CENTROS_CIUDAD[zona];
  // Acepta también "Barcelona" sin ", Spain"
  if (zona) {
    const clave = Object.keys(CENTROS_CIUDAD).find(
      (k) => k.toLowerCase().startsWith(String(zona).toLowerCase().split(',')[0].trim()),
    );
    if (clave) return CENTROS_CIUDAD[clave];
  }
  return CENTRO_CATALUNA;
}

// Provincia por los dos primeros dígitos del código postal.
const ZONA_POR_CP = { '08': 'Barcelona, Spain', 17: 'Girona, Spain', 25: 'Lleida, Spain', 43: 'Tarragona, Spain' };

/** Código postal del local: el campo propio o el que aparezca en la dirección. */
function codigoPostalDe(r) {
  const cp = String(r?.codigoPostal || '').trim();
  if (/^\d{5}$/.test(cp)) return cp;
  return /\b(\d{5})\b/.exec(String(r?.direccion || ''))?.[1] || '';
}

/**
 * Asigna un local a una de las 4 provincias (Barcelona, Tarragona, Girona, Lleida).
 * Orden: código postal (08/17/25/43, el dato oficial), zona de búsqueda si es una
 * de las 4 y, solo si no hay nada más, la capital más cercana por coordenadas.
 * Devuelve '' si no hay forma de ubicarlo.
 * @param {{ zona?: string, codigoPostal?: string, direccion?: string, coords?: { lat: number|string, lng: number|string } }} r
 */
export function zonaPrincipal(r) {
  const porCp = ZONA_POR_CP[codigoPostalDe(r).slice(0, 2)];
  if (porCp) return porCp;
  if (r?.zona && CENTROS_CIUDAD[r.zona]) return r.zona;
  const lat = Number(r?.coords?.lat);
  const lng = Number(r?.coords?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  let mejor = '';
  let menor = Infinity;
  for (const [zona, c] of Object.entries(CENTROS_CIUDAD)) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < menor) { menor = d; mejor = zona; }
  }
  return mejor;
}
