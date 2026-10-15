import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DISTANCIAS, claveNivel, ofertaVacia, ofertaAFormulario, nivelesMejoran,
  validarOferta, paraGuardar, estadoOferta, hoyMadrid, erroresDeApi, claveErrorApi,
} from '../src/models/ofertasModel.js';

const buenos = () => DISTANCIAS.map((distancia, i) => ({ distancia, texto: `Nivel ${i}`, descuentoPct: [5, 10, 15, 20][i] }));

test('los 4 niveles van siempre en el orden 1000, 500, 100 y 20 m', () => {
  assert.deepEqual(DISTANCIAS, [1000, 500, 100, 20]);
  assert.equal(claveNivel(20), 'nivel20');
});

test('nivelesMejoran: descuento decreciente o llegada sin mejorar no valen', () => {
  assert.equal(nivelesMejoran(buenos()), true);
  assert.equal(nivelesMejoran(buenos().map((n, i) => ({ ...n, descuentoPct: 10 }))), false);
  const decreciente = buenos(); decreciente[2].descuentoPct = 5;
  assert.equal(nivelesMejoran(decreciente), false);
  assert.equal(nivelesMejoran([]), false);
});

test('validarOferta acepta una oferta completa y saneada', () => {
  assert.equal(validarOferta({ titulo: 'Menú', activa: true, desde: null, hasta: null, niveles: buenos() }), null);
});

test('validarOferta marca título, fechas y niveles con claves i18n', () => {
  assert.deepEqual(validarOferta({ titulo: '', activa: true, niveles: buenos() }).titulo, ['errTitulo']);
  assert.deepEqual(validarOferta({ titulo: 'Ok', activa: true, desde: 'hoy', niveles: buenos() }).desde, ['errFechas']);
  assert.deepEqual(validarOferta({ titulo: 'Ok', activa: true, desde: '2026-10-10', hasta: '2026-10-01', niveles: buenos() }).hasta, ['errFechasPosterior']);
  const desorden = buenos(); [desorden[0], desorden[1]] = [desorden[1], desorden[0]];
  assert.deepEqual(validarOferta({ titulo: 'Ok', activa: true, niveles: desorden }).niveles, ['errNivelesOrden']);
  assert.deepEqual(validarOferta({ titulo: 'Ok', activa: true, niveles: buenos().map((n, i) => ({ ...n, descuentoPct: [5, 4, 3, 2][i] })) }).niveles, ['errNivelesMejora']);
  assert.deepEqual(validarOferta({ titulo: 'Ok', activa: true, niveles: buenos().map((n, i) => ({ ...n, descuentoPct: [5, 10, 15, 101][i] })) }).niveles, ['errNivelesCampos']);
});

test('ofertaVacia y ofertaAFormulario siempre devuelven los 4 niveles en orden', () => {
  for (const o of [ofertaVacia(), ofertaAFormulario({ titulo: 'X', niveles: [{ distancia: 20, texto: 'Llegada', descuentoPct: 20 }] })]) {
    assert.deepEqual(o.niveles.map((n) => n.distancia), DISTANCIAS);
  }
  assert.equal(ofertaAFormulario({ niveles: [{ distancia: 100, texto: '  15 %  ', descuentoPct: '15' }] }).niveles[2].texto, '15 %');
  assert.equal(ofertaAFormulario({ niveles: [{ distancia: 100, descuentoPct: '15' }] }).niveles[2].descuentoPct, 15);
});

test('paraGuardar limpia, numérica y solo lleva restauranteId en el alta', () => {
  const form = { titulo: '  Menú  ', activa: true, desde: '', hasta: null, niveles: buenos().map((n) => ({ ...n, descuentoPct: String(n.descuentoPct) })) };
  assert.equal(paraGuardar(form, 'r1').restauranteId, 'r1');
  const put = paraGuardar(form);
  assert.equal('restauranteId' in put, false);
  assert.equal(put.titulo, 'Menú');
  assert.equal(put.desde, null);
  assert.equal(put.niveles[0].descuentoPct, 5);
  assert.equal(put.niveles[3].distancia, 20);
});

test('estadoOferta distingue activa, fuera de vigencia e inactiva', () => {
  const hoy = '2026-10-15';
  assert.equal(estadoOferta({ activa: true }, hoy), 'activa');
  assert.equal(estadoOferta({ activa: true, desde: '2026-10-01', hasta: '2026-10-31' }, hoy), 'activa');
  assert.equal(estadoOferta({ activa: true, hasta: '2026-10-14' }, hoy), 'fueraVigencia');
  assert.equal(estadoOferta({ activa: false }, hoy), 'inactiva');
});

test('hoyMadrid usa la fecha de Madrid, la misma que el backend', () => {
  assert.equal(hoyMadrid(new Date('2026-10-15T23:30:00Z')), '2026-10-16');
  assert.equal(hoyMadrid(new Date('2026-10-15T01:00:00Z')), '2026-10-15');
  assert.match(hoyMadrid(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(estadoOferta({ activa: true }), estadoOferta({ activa: true }, hoyMadrid()));
});

test('erroresDeApi traduce los details del 400 y devuelve null sin detalles', () => {
  assert.deepEqual(erroresDeApi({ status: 400, data: { details: { niveles: ['x'], titulo: ['y'] } } }), { niveles: ['errNiveles'], titulo: ['errTitulo'] });
  assert.equal(erroresDeApi({ status: 400, data: {} }), null);
});

test('claveErrorApi mapea cada estado al mensaje general', () => {
  assert.equal(claveErrorApi({ status: 409 }), 'errActivaExistente');
  assert.equal(claveErrorApi({ status: 403 }), 'errPermiso');
  assert.equal(claveErrorApi({ status: 404 }), 'errNoEncontrada');
  assert.equal(claveErrorApi({ status: 400, message: 'Los niveles deben...' }), 'errNiveles');
  assert.equal(claveErrorApi({ status: 400, message: 'Titulo invalido' }), 'errValidacion');
  assert.equal(claveErrorApi(new Error('Network')), 'errRed');
});
