/**
 * Estadísticas de ofertas (G07): contrato oficial (fila por día con avisos
 * por nivel, visitas y confirmadas), saneado, series para Recharts y KPI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DISTANCIAS, etiquetaDistancia, sanearEstadisticas, aSeriesNivel, aSeriesFechas,
  formatearFecha, resumen,
} from '../src/models/ofertasStatsModel.js';

const RESPUESTA = {
  data: [
    { fecha: '2026-10-14', avisos: { 1000: 30, 500: 20, 100: 10, 20: 5 }, visitas: 4, confirmadas: 3 },
    { fecha: '2026-10-13', avisos: { 1000: 12, 500: 8, 100: 4, 20: 2 }, visitas: 2, confirmadas: 1 },
  ],
};

test('etiquetaDistancia: 1000 → "1 km", el resto en metros', () => {
  assert.equal(etiquetaDistancia(1000), '1 km');
  assert.equal(etiquetaDistancia(1500), '1,5 km');
  assert.equal(etiquetaDistancia(500), '500 m');
  assert.equal(etiquetaDistancia(20), '20 m');
  assert.equal(etiquetaDistancia('x'), '—');
});

test('sanear: acepta { data } o el array, y descarta filas mal formadas', () => {
  const s = sanearEstadisticas(RESPUESTA);
  assert.deepEqual(s.porNivel.map((n) => n.distancia), DISTANCIAS);
  assert.deepEqual(s.porNivel.map((n) => n.avisos), [42, 28, 14, 7]);
  assert.equal(sanearEstadisticas(RESPUESTA.data).porNivel[0].avisos, 42);
  assert.equal(sanearEstadisticas(null).porFecha.length, 0);
  assert.equal(sanearEstadisticas({ data: 'garbage' }).porNivel.every((n) => n.avisos === 0), true);
});

test('sanear: fechas validadas, ordenadas y números redondeados a cero si no son positivos', () => {
  const s = sanearEstadisticas({
    data: [
      { fecha: '2026-10-15', avisos: { 1000: 10.7, 500: -3 }, visitas: '2', confirmadas: null },
      { fecha: 'no-es-fecha', avisos: { 1000: 99 } },
      { fecha: '2026-10-13', avisos: { 1000: 1 }, visitas: 0, confirmadas: 0 },
    ],
  });
  assert.deepEqual(s.porFecha.map((f) => f.fecha), ['2026-10-13', '2026-10-15']);
  assert.equal(s.porFecha[1].avisos, 11); // 11 (1000) + 0 (500)
  assert.equal(s.porFecha[1].visitas, 2);
  assert.equal(s.porFecha[1].confirmadas, 0);
  assert.equal(s.porNivel.find((n) => n.distancia === 500).avisos, 0);
});

test('aSeriesNivel incluye etiqueta legible por nivel', () => {
  const serie = aSeriesNivel(RESPUESTA);
  assert.equal(serie.length, 4);
  assert.equal(serie[0].nivel, '1 km');
  assert.equal(serie[3].nivel, '20 m');
  assert.equal(serie[0].avisos, 42);
});

test('aSeriesFechas: avisos totales del día + visitas + confirmadas', () => {
  const serie = aSeriesFechas(RESPUESTA, 'es-ES');
  assert.equal(serie[0].dia, '13 oct');
  assert.equal(serie[0].avisos, 26); // 12+8+4+2
  assert.equal(serie[0].visitas, 2);
  assert.equal(serie[0].confirmadas, 1);
  assert.equal(formatearFecha('basura'), 'basura');
});

test('formatearFecha usa mediodía local para no pintar el día anterior en UTC−', () => {
  // Mediodía local: en cualquier zona horaria el día calendario es el mismo.
  assert.equal(formatearFecha('2026-10-13', 'es-ES'), '13 oct');
});

test('resumen: totales, tasa = confirmadas / avisos 1 km y días', () => {
  const r = resumen(RESPUESTA);
  assert.equal(r.totalAvisos, 91); // 42+28+14+7
  assert.equal(r.totalVisitas, 6);
  assert.equal(r.totalConfirmadas, 4);
  assert.equal(r.tasaLlegadas, 0.1); // 4 / 42
  assert.equal(r.dias, 2);
  assert.equal(resumen({}).tasaLlegadas, 0);
  assert.equal(resumen({}).dias, 0);
});
