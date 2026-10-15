/**
 * Escáner QR (G10): saneado de códigos, mapeo de errores del endpoint real
 * de validación, normalización de la respuesta y lista de llegadas del día.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ESTADOS, normalizarCodigo, estadoDesdeError, claveMensajeEstado, aLlegada, agregarLlegada,
} from '../src/models/escanerModel.js';

test('normalizar: recorta, descarta vacíos, largos y controles', () => {
  assert.equal(normalizarCodigo('  v1.vis1.1799999999999.firma  '), 'v1.vis1.1799999999999.firma');
  assert.equal(normalizarCodigo(''), null);
  assert.equal(normalizarCodigo('   '), null);
  assert.equal(normalizarCodigo(null), null);
  assert.equal(normalizarCodigo(123), null);
  assert.equal(normalizarCodigo('x'.repeat(1025)), null);
  assert.equal(normalizarCodigo('v1.a\u0000b.c'), null);
});

test('estadoDesdeError: códigos reales del endpoint de validar', () => {
  assert.equal(estadoDesdeError({ status: 400 }), ESTADOS.INVALIDO);   // QR_INVALIDO
  assert.equal(estadoDesdeError({ status: 404 }), ESTADOS.INVALIDO);   // visita inexistente
  assert.equal(estadoDesdeError({ status: 403 }), ESTADOS.OTRO_RESTAURANTE);
  assert.equal(estadoDesdeError({ status: 409 }), ESTADOS.YA_USADO);   // QR_USADO
  assert.equal(estadoDesdeError({ status: 410 }), ESTADOS.CADUCADO);   // QR_CADUCADO
  assert.equal(estadoDesdeError({ status: 500 }), ESTADOS.ERROR_RED);
  assert.equal(estadoDesdeError(null), ESTADOS.ERROR_RED);
  assert.equal(estadoDesdeError(new Error('red caída')), ESTADOS.ERROR_RED);
});

test('claveMensajeEstado: una clave i18n por estado y fallback', () => {
  assert.equal(claveMensajeEstado(ESTADOS.OK), 'escaner.estadoOk');
  assert.equal(claveMensajeEstado(ESTADOS.YA_USADO), 'escaner.estadoYaUsado');
  assert.equal(claveMensajeEstado('inventado'), 'escaner.estadoInvalido');
});

test('aLlegada: de la fila de la lista (Visita + cliente)', () => {
  const fila = {
    id: 'vis123', estado: 'confirmada', creada: '2026-10-15T13:00:00.000Z', confirmadaEn: '2026-10-15T13:05:00.000Z',
    nivel: { distancia: 20, texto: '20 % + postre gratis', descuentoPct: 20 },
    cliente: { nombre: 'Laura G.' },
  };
  const l = aLlegada(fila);
  assert.equal(l.id, 'vis123');
  assert.equal(l.cliente, 'Laura G.');
  assert.equal(l.texto, '20 % + postre gratis');
  assert.equal(l.descuentoPct, 20);
  assert.equal(l.hora, '2026-10-15T13:05:00.000Z');
  assert.equal(l.estado, 'confirmada');
  assert.equal(aLlegada(null), null);
  assert.equal(aLlegada({}), null);
});

test('aLlegada: de la respuesta de validar (visita + aplicar + cliente)', () => {
  const r = {
    visita: { id: 'vis9', estado: 'confirmada', nivel: { texto: '20 % + postre gratis', descuentoPct: 20 } },
    aplicar: { texto: '20 % + postre gratis', descuentoPct: 20 },
    cliente: { nombre: 'Marc P.' },
  };
  const l = aLlegada({ ...r.visita, cliente: r.cliente });
  assert.equal(l.id, 'vis9');
  assert.equal(l.cliente, 'Marc P.');
  assert.equal(l.texto, '20 % + postre gratis');
  assert.equal(l.descuentoPct, 20);
});

test('agregarLlegada: sin duplicados, más reciente arriba, valida la entrada', () => {
  const a = { id: 'a', cliente: 'Laura' };
  const b = { id: 'b' };
  let lista = agregarLlegada([], a);
  lista = agregarLlegada(lista, b);
  assert.deepEqual(lista.map((v) => v.id), ['b', 'a']);
  lista = agregarLlegada(lista, a);
  assert.deepEqual(lista.map((v) => v.id), ['a', 'b']);
  assert.equal(agregarLlegada(lista, null), lista);
  assert.equal(agregarLlegada(lista, {}), lista);
  assert.equal(agregarLlegada(undefined, a).length, 1);
});
