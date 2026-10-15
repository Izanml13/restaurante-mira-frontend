/**
 * Lógica pura de las estadísticas de ofertas (G07, fase 2).
 * Transforma la forma de la API (ver docs/coordenacion/CONTRATOS-ASUMIDOS.md)
 * en series listas para Recharts, sin dependencias de React ni de la red.
 *
 * Mientras no exista el endpoint real se usa `estadisticasMock`, con la
 * misma forma que devolverá la API (contadores agregados, sin ubicaciones).
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
 * Sanea la respuesta de la API: siempre las 4 distancias (las que falten van
 * a cero), números no negativos y fechas ordenadas de más antigua a más reciente.
 */
export function sanearEstadisticas(datos) {
  const origen = datos && typeof datos === 'object' ? datos : {};
  const cuenta = (x, campo) => {
    const v = Number(x?.[campo]);
    return Number.isFinite(v) && v > 0 ? Math.round(v) : 0;
  };

  const porDistancia = new Map();
  for (const fila of Array.isArray(origen.porNivel) ? origen.porNivel : []) {
    porDistancia.set(fila?.distancia, { avisos: cuenta(fila, 'avisos'), llegadas: cuenta(fila, 'llegadas') });
  }
  const porNivel = DISTANCIAS.map((distancia) => ({
    distancia,
    ...(porDistancia.get(distancia) || { avisos: 0, llegadas: 0 }),
  }));

  const porFecha = (Array.isArray(origen.porFecha) ? origen.porFecha : [])
    .filter((f) => typeof f?.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f.fecha))
    .map((f) => ({ fecha: f.fecha, avisos: cuenta(f, 'avisos'), llegadas: cuenta(f, 'llegadas') }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

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

/** "2026-10-13" → "13 oct" (local); cadena inválida → la propia fecha. */
export function formatearFecha(iso, locale = 'es-ES') {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

/** Resumen de cabecera para las tarjetas KPI. */
export function resumen(datos) {
  const { porNivel, porFecha } = sanearEstadisticas(datos);
  const totalAvisos = porNivel.reduce((s, n) => s + n.avisos, 0);
  const totalLlegadas = porNivel.reduce((s, n) => s + n.llegadas, 0);
  const mejorNivel = porNivel.reduce(
    (mejor, n) => (n.llegadas > mejor.llegadas ? n : mejor),
    porNivel[0],
  );
  return {
    totalAvisos,
    totalLlegadas,
    tasaLlegadas: totalAvisos > 0 ? Math.round((totalLlegadas / totalAvisos) * 100) / 100 : 0,
    mejorDistancia: mejorNivel.llegadas > 0 ? mejorNivel.distancia : null,
    dias: porFecha.length,
  };
}

/**
 * Mock local con la forma del contrato asumido, para desarrollar el panel
 * mientras PC 1 no publica GET /v1/ofertas/estadisticas.
 */
export function estadisticasMock() {
  const porNivel = [
    { distancia: 1000, avisos: 148, llegadas: 6 },
    { distancia: 500, avisos: 96, llegadas: 11 },
    { distancia: 100, avisos: 54, llegadas: 17 },
    { distancia: 20, avisos: 23, llegadas: 21 },
  ];
  const porFecha = [
    { fecha: '2026-10-09', avisos: 31, llegadas: 4 },
    { fecha: '2026-10-10', avisos: 44, llegadas: 7 },
    { fecha: '2026-10-11', avisos: 52, llegadas: 9 },
    { fecha: '2026-10-12', avisos: 38, llegadas: 6 },
    { fecha: '2026-10-13', avisos: 61, llegadas: 12 },
    { fecha: '2026-10-14', avisos: 57, llegadas: 13 },
    { fecha: '2026-10-15', avisos: 38, llegadas: 7 },
  ];
  return { porNivel, porFecha };
}
