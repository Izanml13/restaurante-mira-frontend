import test from 'node:test';
import assert from 'node:assert/strict';
import { zonaPrincipal } from '../src/services/cityCenters.js';

test('mantiene la zona si ya es una de las 4', () => {
  assert.equal(zonaPrincipal({ zona: 'Girona, Spain' }), 'Girona, Spain');
});

test('asigna otras poblaciones a la zona más cercana', () => {
  assert.equal(zonaPrincipal({ zona: 'Salou, Spain', coords: { lat: 41.077, lng: 1.131 } }), 'Tarragona, Spain');
  assert.equal(zonaPrincipal({ zona: 'Gerona, Spain', coords: { lat: '41.98', lng: '2.82' } }), 'Girona, Spain');
  assert.equal(zonaPrincipal({ zona: 'Alcarras, Spain', coords: { lat: 41.563, lng: 0.525 } }), 'Lleida, Spain');
});

test('sin zona válida ni coordenadas devuelve vacío', () => {
  assert.equal(zonaPrincipal({ zona: 'Salou, Spain' }), '');
  assert.equal(zonaPrincipal(null), '');
});
