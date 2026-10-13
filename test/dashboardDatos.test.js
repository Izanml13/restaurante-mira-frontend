import test from 'node:test';
import assert from 'node:assert/strict';
import { unirReservas } from '../src/components/dashboard/dashboardDatos.js';

test('una reserva de hoy compartida entre arrays cuenta una vez y conserva los 4 pax', () => {
  const r = { id: 'r1', fecha: '2026-10-13', comensales: 4, estado: 'confirmada' };
  const lista = unirReservas([r], [{ ...r }]);
  assert.equal(lista.length, 1);
  assert.equal(lista.reduce((n, x) => n + x.comensales, 0), 4);
});

test('reservas distintas del mismo día y futuras se conservan, sin perder registros sin id', () => {
  const a = { id: 'a', comensales: 2 }, b = { id: 'b', comensales: 3 };
  const sinId = [{ comensales: 1 }, { comensales: 5 }];
  assert.deepEqual(unirReservas([a], [a, b], sinId), [a, b, ...sinId]);
});
