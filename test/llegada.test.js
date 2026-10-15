import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import { trazadoQR, segundosRestantes, formatoCuenta, estadoVisible } from '../src/models/llegadaModel.js';

test('trazadoQR: un cuadrado por módulo oscuro, del tamaño del QR', () => {
  const texto = 'v1.vis123.1792054800000.firmaBase64url_-';
  const { size, d } = trazadoQR(texto);
  const { modules } = QRCode.create(texto, { errorCorrectionLevel: 'M' });
  assert.equal(size, modules.size);
  const oscuros = [...modules.data].filter(Boolean).length;
  assert.equal((d.match(/M/g) || []).length, oscuros);
  assert.match(d, /^M\d+ \d+h1v1h-1z/);
});

test('segundosRestantes y formatoCuenta', () => {
  const ahora = Date.parse('2026-10-15T20:01:00.000Z');
  assert.equal(segundosRestantes('2026-10-15T20:16:00.000Z', ahora), 900);
  assert.equal(segundosRestantes('2026-10-15T20:00:00.000Z', ahora), 0);
  assert.equal(segundosRestantes('no es fecha', ahora), 0);
  assert.equal(formatoCuenta(900), '15:00');
  assert.equal(formatoCuenta(65), '1:05');
  assert.equal(formatoCuenta(-3), '0:00');
});

test('estadoVisible: pendiente pasada de hora se ve caducada', () => {
  const ahora = Date.parse('2026-10-15T20:20:00.000Z');
  assert.equal(estadoVisible({ estado: 'pendiente', caducaEn: '2026-10-15T20:30:00.000Z' }, ahora), 'pendiente');
  assert.equal(estadoVisible({ estado: 'pendiente', caducaEn: '2026-10-15T20:16:00.000Z' }, ahora), 'caducada');
  assert.equal(estadoVisible({ estado: 'confirmada', caducaEn: '2026-10-15T20:16:00.000Z' }, ahora), 'confirmada');
  assert.equal(estadoVisible(null), null);
});
