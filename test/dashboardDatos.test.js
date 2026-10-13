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

import { filtrarTicketsPeriodo } from '../src/components/dashboard/dashboardDatos.js';
import { fechaDeTicket } from '../src/components/fiscal/fiscalReal.js';
const ahora = new Date(2026, 9, 13, 12);

test('este mes excluye el anterior y admite las fechas ISO que devuelve la API', () => {
  const actual = { id: 'octubre', createdAt: '2026-10-01T12:00:00Z' };
  assert.deepEqual(filtrarTicketsPeriodo([actual, { fecha: '2026-09-30' }, {}], 'este-mes', ahora), [actual]);
});

test('normaliza Date y Timestamp sin inventar fecha al recibir un valor inválido', () => {
  const valor = new Date('2026-10-02T12:00:00Z');
  for (const createdAt of [valor, { toDate: () => valor }, { seconds: valor.getTime() / 1000 }, { _seconds: valor.getTime() / 1000 }]) {
    assert.equal(fechaDeTicket({ createdAt }), '2026-10-02');
  }
  assert.equal(fechaDeTicket({ createdAt: 'invalida' }), '');
});

test('año y últimos 90 días mantienen sus filtros propios', () => {
  const reciente = { fecha: '2026-10-10' }, antiguo = { fecha: '2026-01-01' }, otroAnio = { fecha: '2025-12-31' };
  assert.deepEqual(filtrarTicketsPeriodo([reciente, antiguo, otroAnio], 'anio', ahora), [reciente, antiguo]);
  assert.deepEqual(filtrarTicketsPeriodo([reciente, antiguo, otroAnio], '90d', ahora), [reciente]);
});

test('el cambio de mes de un timestamp se interpreta en Europe/Madrid', () => {
  const ticket = { createdAt: '2026-09-30T22:30:00Z' }; // 1 de octubre, 00:30 en Madrid
  assert.equal(fechaDeTicket(ticket), '2026-10-01');
  assert.deepEqual(filtrarTicketsPeriodo([ticket], 'este-mes', ahora), [ticket]);
  assert.deepEqual(filtrarTicketsPeriodo([ticket], 'este-mes', new Date('2026-09-30T22:30:00Z')), [ticket]);
});

import { csvLiquidacion } from '../src/components/dashboard/dashboardDatos.js';

test('CSV refleja asistencia real sin cambiar importes ni columnas', () => {
  const csv = csvLiquidacion([
    { id: 'asiste', fecha: '2026-10-13', totalPagado: 100, asistio: true },
    { id: 'no-show', fecha: '2026-10-13', totalPagado: 100, asistio: false },
    { id: 'legacy', fecha: '2026-10-13', totalPagado: 100 },
  ], 8).split('\n');
  assert.equal(csv[0].split(';').length, 7);
  assert.deepEqual(csv.slice(1).map(r => r.split(';').at(-1)), ['si', 'no', 'si']);
  assert.deepEqual(csv[2].split(';').slice(3, 6), ['100.00', '8.00', '92.00']);
});
