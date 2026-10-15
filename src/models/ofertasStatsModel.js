/**
 * Lógica pura de las estadísticas de ofertas (G07, fase 2/3).
 * Consume el contrato oficial (Contratos API.md, fase 3):
 *   GET /v1/ofertas/estadisticas → { data: [{ fecha, avisos: {1000,500,100,20}, visitas, confirmadas }] }
 * un elemento por día con datos. Sin datos de usuario ni de ubicación.
 *
 * No existen «llegadas por nivel»: el QR solo se genera a 20 m, así que las
 * llegadas (visitas/confirmadas) son por día. Los avisos sí son por nivel.
 */

/** Distancias fijas del modelo de oferta, de lejos a cerca. */
export const DISTANCIAS = [1000, 500, 100, 20];

/** Etiqueta corta de una distancia: 1000 → "1 km", 500 → "500 m". */
export function etiquetaDistancia(m) {
  if (!Number.isFinite(m)) return '—';
  if (m >= 1000) {
    const km = m / 1000;
    return `${Number.isInteger(km) ? km : km.toFixed(1).replace('.', ',')} km`;
  }
  return `${Math.round(m)} m`;
}

/**
 * Sanea la respuesta de la API (acepta `{ data: [...] }` o el array suelto):
 * suma los avisos por nivel a lo largo de los días para la gráfica de barras,
 * y deja una fila por día (fecha, avisos totales, visitas y confirmadas) para
 * la línea. Días sin forma válida se descartan; fechas ordenadas de antigua a
 * reciente.
 */
export function sanearEstadisticas(datos) {
  const filas = Array.isArray(datos) ? datos
    : Array.isArray(datos?.data) ? datos.data
    : [];
  const cuenta = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v)) : 0);
  const avisosNivel = Object.fromEntries(DISTANCIAS.map((d) => [d, 0]));

  const porFecha = filas
    .filter((f) => typeof f?.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f.fecha))
    .map((f) => {
      const nivel = f.avisos && typeof f.avisos === 'object' ? f.avisos : {};
      let total = 0;
      for (const d of DISTANCIAS) {
        const n = cuenta(nivel[d]);
        avisosNivel[d] += n;
        total += n;
      }
      return { fecha: f.fecha, avisos: total, visitas: cuenta(f.visitas), confirmadas: cuenta(f.confirmadas) };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const porNivel = DISTANCIAS.map((distancia) => ({ distancia, avisos: avisosNivel[distancia] }));
  return { porNivel, porFecha };
}

/** Series para el gráfico de barras por nivel (etiqueta legible incluida). */
export function aSeriesNivel(datos) {
  return sanearEstadisticas(datos).porNivel.map((n) => ({
    ...n,
    nivel: etiquetaDistancia(n.distancia),
  }));
}

/** Series para el gráfico por fecha, con el día en formato local corto. */
export function aSeriesFechas(datos, locale = 'es-ES') {
  return sanearEstadisticas(datos).porFecha.map((f) => ({
    ...f,
    dia: formatearFecha(f.fecha, locale),
  }));
}

/**
 * "2026-10-13" → "13 oct" (local). T12:00 en punto (hora local) para que en
 * zonas UTC− no se pinte el día anterior.
 */
export function formatearFecha(iso, locale = 'es-ES') {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

/**
 * Resumen de cabecera para las tarjetas KPI.
 * `tasaLlegadas` = confirmadas / avisos del nivel 1 km (el aviso más amplio:
 * quien lo ve es quien está a 1 km, el inicio del embudo).
 */
export function resumen(datos) {
  const { porNivel, porFecha } = sanearEstadisticas(datos);
  const totalAvisos = porNivel.reduce((s, n) => s + n.avisos, 0);
  const totalVisitas = porFecha.reduce((s, f) => s + f.visitas, 0);
  const totalConfirmadas = porFecha.reduce((s, f) => s + f.confirmadas, 0);
  const avisos1km = porNivel.find((n) => n.distancia === 1000)?.avisos || 0;
  return {
    totalAvisos,
    totalVisitas,
    totalConfirmadas,
    tasaLlegadas: avisos1km > 0 ? Math.round((totalConfirmadas / avisos1km) * 100) / 100 : 0,
    dias: porFecha.length,
  };
}
