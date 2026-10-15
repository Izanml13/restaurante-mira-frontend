import { api } from './httpClient.js';

/**
 * Ofertas por distancia del restaurante (G04). CRUD contra /v1/ofertas;
 * la autenticación de empresa va sola por el httpClient (token Firebase).
 */
export const ofertasApi = {
  listarMias: async (restauranteId) => {
    const d = await api.get(`/v1/ofertas/mias?restauranteId=${encodeURIComponent(restauranteId)}`);
    return Array.isArray(d?.data) ? d.data : [];
  },
  crear: (data) => api.post('/v1/ofertas', data),
  editar: (id, data) => api.put(`/v1/ofertas/${encodeURIComponent(id)}`, data),
  borrar: (id) => api.del(`/v1/ofertas/${encodeURIComponent(id)}`),
};
