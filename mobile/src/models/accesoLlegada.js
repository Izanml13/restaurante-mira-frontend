/** Usa el radio de cortesía de POST /visitas (50 m); la API valida de nuevo. */
export function ofertaParaLlegada(resultados, restauranteId) {
  return (resultados || []).find(r => String(r?.restaurante?.id) === String(restauranteId)
    && r?.oferta?.id && Number.isFinite(r.distanciaM) && r.distanciaM >= 0 && r.distanciaM <= 50) || null;
}
