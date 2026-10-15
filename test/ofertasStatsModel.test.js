/**
 * Estadísticas de ofertas (G07): saneado de la respuesta de la API, series
 * para Recharts, resumen KPI y mock local con la forma del contrato.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DISTANCIAS, etiquetaDistancia, sanearEstadisticas, aSeriesNivel, aSeriesFechas,
  formatearFecha, resumen, estadisticasMock,
} from '../src/models/ofertasStatsModel.js';

test('etiquetaDistancia: 1000 → "1 km", el resto en metros', () => {
  assert.equal(etiquetaDistancia(1000), '1 km');
  assert.equal(etiquetaDistancia(1500), '1,5 km');
  assert.equal(etiquetaDistancia(500), '500 m');
  assert.equal(etiquetaDistancia(20), '20 m');
  assert.equal(etiquetaDistancia('x'), '—');
});

test('sanear: siempre las 4 distancias, ceros y números redondeados', () => {
  const s = sanearEstadisticas({
    porNivel: [
      { distancia: 500, avisos: 10.7, llegadas: -3 },
      { distancia: 9999, avisos: 5, llegadas: 1 },
      { distancia: 1000, avisos: '12', llegadas: null },
    ],
  });
  assert.deepEqual(s.porNivel.map((n) => n.distancia), DISTANCIAS);
  assert.deepEqual(s.porNivel.map((n) => n.avisos), [12, 11, 0, 0]);
  assert.deepEqual(s.porNivel.map((n) => n.llegadas), [0, 0, 0, 0]);
  assert.deepEqual(s.porFecha, []);
  assert.deepEqual(sanearEstadisticas(null).porNivel.map((n) => n.distancia), DISTANCIAS);
  assert.deepEqual(sanearEstadisticas({ porNivel: 'garbage', porFecha: [{}] }).porFecha, []);
});

test('sanear: fechas se validan y ordenan de antigua a reciente', () => {
  const s = sanearEstadisticas({
    porFecha: [
      { fecha: '2026-10-15', avisos: 3 },
      { fecha: 'no-es-fecha', avisos: 9 },
      { fecha: '2026-10-13', avisos: 1, llegadas: 2 },
    ],
  });
  assert.deepEqual(s.porFecha.map((f) => f.fecha), ['2026-10-13', '2026-10-15']);
  assert.equal(s.porFecha[0].llegadas, 2);
});

test('aSeriesNivel incluye etiqueta legible por nivel', () => {
  const serie = aSeriesNivel(estadisticasMock());
  assert.equal(serie.length, 4);
  assert.equal(serie[0].nivel, '1 km');
  assert.equal(serie[3].nivel, '20 m');
  assert.ok(serie[3].llegadas >= serie[0].llegadas);
});

test('aSeriesFechas formatea el día en el locale pedido', () => {
  const serie = aSeriesFechas({ porFecha: [{ fecha: '2026-10-13', avisos: 1 }] }, 'es-ES');
  assert.equal(serie[0].dia, '13 oct');
  assert.equal(formatearFecha('basura'), 'basura');
});

test('resumen: totales, tasa y mejor nivel', () => {
  const r = resumen({
    porNivel: [
      { distancia: 1000, avisos: 100, llegadas: 5 },
      { distancia: 500, avisos: 40, llegadas: 10 },
      { distancia: 100, avisos: 0, llegadas: 0 },
      { distancia: 20, avisos: 0, llegadas: 0 },
    ],
    porFecha: [{ fecha: '2026-10-14', avisos: 5 }, { fecha: '2026-10-15', avisos: 5 }],
  });
  assert.equal(r.totalAvisos, 140);
  assert.equal(r.totalLlegadas, 15);
  assert.equal(r.tasaLlegadas, 0.11);
  assert.equal(r.mejorDistancia, 500);
  assert.equal(r.dias, 2);
  assert.equal(resumen({}).tasaLlegadas, 0);
  assert.equal(resumen({}).mejorDistancia, null);
});

test('estadisticasMock: forma completa y coherente con el contrato', () => {
  const m = estadisticasMock();
  assert.deepEqual(m.porNivel.map((n) => n.distancia), DISTANCIAS);
  assert.ok(m.porFecha.length >= 5);
  assert.ok(m.porFecha.every((f) => /^\d{4}-\d{2}-\d{2}$/.test(f.fecha)));
  assert.deepEqual(Object.keys(sanearEstadisticas(m)).sort(), ['porFecha', 'porNivel']);
});
