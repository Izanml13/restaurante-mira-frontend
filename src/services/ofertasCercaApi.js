/** Ofertas por distancia (G06). La posición solo viaja para calcular la distancia; la API no la guarda. */
import { api } from './httpClient.js';

export async function ofertasCerca({ lat, lng }) {
  const r = await api.get(`/v1/ofertas/cerca?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`, { auth: false });
  return Array.isArray(r?.data) ? r.data : [];
}

/** Cuenta un aviso mostrado (estadísticas del restaurante, G07). Sin datos del usuario. */
export function registrarAviso(ofertaId, nivel) {
  return api.post(`/v1/ofertas/${encodeURIComponent(ofertaId)}/avisos`, { nivel }, { auth: false });
}
