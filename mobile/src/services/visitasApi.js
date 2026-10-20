/** Visitas con QR (G09). La posición solo se usa para comprobar los 50 m; la API no la guarda. */
import { api } from './httpClient.js';

/** 201 → { visita, qr }. 422 LEJOS → lanza un error con .distanciaM. */
export async function crearVisita({ restauranteId, lat, lng }) {
  return api.post('/v1/visitas', { restauranteId: String(restauranteId), lat, lng });
}

export function verVisita(id) {
  return api.get(`/v1/visitas/${encodeURIComponent(id)}`);
}
