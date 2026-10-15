import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularMetricas, filtrarResueltas, fechaIncidencia } from '../src/services/incidenciaMetricas.js';
const inicio = '2026-10-01T00:00:00Z';
const lista = [
 { id: '1', resueltoPor: 'ana', resueltoPorNombre: 'Ana', creado: inicio, resueltaEn: '2026-10-01T02:00:00Z', solucion: 'Abono' },
 { id: '2', resueltoPor: 'ana', creado: inicio, resueltaEn: { _seconds: Date.parse('2026-10-02T00:00:00Z') / 1000 } },
 { id: '3', resueltoPor: 'bea', creado: inicio, resueltaEn: '2026-10-01T04:00:00Z' },
 { id: '4', resueltoPor: 'bea', creado: inicio, resueltaEn: 'incorrecta' },
 { id: '5', encargado: 'Ana' },
];
test('cuenta por UID, calcula medias con fechas válidas y evolución cronológica', () => {
 const m = calcularMetricas(lista);
 assert.deepEqual(m.personas.map((p) => [p.uid, p.resueltas, p.horasMedias]), [['ana', 2, 13], ['bea', 2, 4], ['sin-autor', 1, null]]);
 assert.deepEqual(m.evolucion.map((d) => [d.dia, d.horasMedias]), [['2026-10-01', 3], ['2026-10-02', 24]]);
});
test('filtros combinan texto y límites inclusivos; excluyen fechas desconocidas', () => {
 assert.deepEqual(filtrarResueltas(lista, { texto: 'ABONO', desde: '2026-10-01', hasta: '2026-10-01' }).map((r) => r.id), ['1']);
 assert.deepEqual(filtrarResueltas(lista, { desde: '2026-10-02' }).map((r) => r.id), ['2']);
 assert.equal(filtrarResueltas(lista, { texto: 'nadie' }).length, 0);
});
test('no inventa tiempos para datos ausentes o negativos y admite Timestamp/Date', () => {
 assert.equal(fechaIncidencia(null), null);
 assert.equal(fechaIncidencia({ seconds: 10 }), 10000);
 assert.equal(fechaIncidencia(new Date(10000)), 10000);
 const m = calcularMetricas([{ resueltoPor: 'a', creado: '2026-10-02', resueltaEn: inicio }]);
 assert.equal(m.personas[0].horasMedias, null); assert.deepEqual(m.evolucion, []);
 assert.deepEqual(calcularMetricas([]), { personas: [], evolucion: [] });
});
