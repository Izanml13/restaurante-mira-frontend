/**
 * Escáner QR (G10): saneado de códigos, mapeo de errores del endpoint de
 * validación, mock local de resultados y lista de llegadas del día.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ESTADOS, normalizarCodigo, esCodigoFormaValida, estadoDesdeError,
  resultadoMock, claveMensajeEstado, agregarLlegada,
} from '../src/models/escanerModel.js';

test('normalizar: recorta, descarta vacíos, largos y controles', () => {
  assert.equal(normalizarCodigo('  MIRA.abc.def  '), 'MIRA.abc.def');
  assert.equal(normalizarCodigo(''), null);
  assert.equal(normalizarCodigo('   '), null);
  assert.equal(normalizarCodigo(null), null);
  assert.equal(normalizarCodigo(123), null);
  assert.equal(normalizarCodigo('x'.repeat(1025)), null);
  assert.equal(normalizarCodigo('MIRA.a\u0000b.c'), null);
});

test('forma del código: MIRA.<payload>.<firma>', () => {
  assert.equal(esCodigoFormaValida('MIRA.cGF5bG9hZA.firma-1_2'), true);
  assert.equal(esCodigoFormaValida('MIRA.solo_payload'), false);
  assert.equal(esCodigoFormaValida('otro.prefijo.firma'), false);
  assert.equal(esCodigoFormaValida('MIRA.pay load.firma'), false);
  assert.equal(esCodigoFormaValida(null), false);
});

test('estadoDesdeError: 400/404 inválido, 403 otro, 409 usado, 410 caducado', () => {
  assert.equal(estadoDesdeError({ status: 400 }), ESTADOS.INVALIDO);
  assert.equal(estadoDesdeError({ status: 404 }), ESTADOS.INVALIDO);
  assert.equal(estadoDesdeError({ status: 403 }), ESTADOS.OTRO_RESTAURANTE);
  assert.equal(estadoDesdeError({ status: 409 }), ESTADOS.YA_USADO);
  assert.equal(estadoDesdeError({ status: 410 }), ESTADOS.CADUCADO);
  assert.equal(estadoDesdeError({ status: 500 }), ESTADOS.ERROR_RED);
  assert.equal(estadoDesdeError(null), ESTADOS.ERROR_RED);
  assert.equal(estadoDesdeError(new Error('red caída')), ESTADOS.ERROR_RED);
});

test('resultadoMock: código con forma válida → ok con oferta de 20 m', async () => {
  const r = await resultadoMock('MIRA.cGF5bG9hZA.firma');
  assert.equal(r.estado, ESTADOS.OK);
  assert.ok(r.visitaId);
  assert.equal(r.oferta.nivel.distancia, 20);
  assert.equal(r.oferta.nivel.descuentoPct, 20);
});

test('resultadoMock: estados de error según el contenido (sin API real)', async () => {
  await assert.rejects(resultadoMock('qr-caducado'), (e) => e.status === 410);
  await assert.rejects(resultadoMock('qr-usado'), (e) => e.status === 409);
  await assert.rejects(resultadoMock('qr-otro'), (e) => e.status === 403);
  await assert.rejects(resultadoMock('esto no es un qr'), (e) => e.status === 400);
  await assert.rejects(resultadoMock(''), (e) => e.status === 400);
});

test('claveMensajeEstado: una clave i18n por estado y fallback', () => {
  assert.equal(claveMensajeEstado(ESTADOS.OK), 'escaner.estadoOk');
  assert.equal(claveMensajeEstado(ESTADOS.YA_USADO), 'escaner.estadoYaUsado');
  assert.equal(claveMensajeEstado('inventado'), 'escaner.estadoInvalido');
});

test('agregarLlegada: sin duplicados, más reciente arriba, valida la entrada', () => {
  const v1 = { visitaId: 'a', oferta: 'Menú' };
  const v2 = { visitaId: 'b' };
  let lista = agregarLlegada([], v1);
  lista = agregarLlegada(lista, v2);
  assert.deepEqual(lista.map((v) => v.visitaId), ['b', 'a']);
  assert.ok(lista[0].hora);
  lista = agregarLlegada(lista, v1);
  assert.deepEqual(lista.map((v) => v.visitaId), ['a', 'b']);
  assert.equal(agregarLlegada(lista, null), lista);
  assert.equal(agregarLlegada(lista, {}), lista);
  assert.equal(agregarLlegada(undefined, v1).length, 1);
});
