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

test('el código postal manda sobre la zona de búsqueda y la distancia', () => {
  // Cervera y Solsona están más cerca de Tarragona/Barcelona, pero son de Lleida (CP 25).
  assert.equal(zonaPrincipal({ zona: 'Cervera, Spain', codigoPostal: '25200', coords: { lat: 41.670, lng: 1.272 } }), 'Lleida, Spain');
  assert.equal(zonaPrincipal({ zona: 'Solsona, Spain', direccion: 'Carrer Major 1, 25280 Solsona, Spain', coords: { lat: 41.994, lng: 1.518 } }), 'Lleida, Spain');
  assert.equal(zonaPrincipal({ zona: 'Barcelona, Spain', codigoPostal: '43840' }), 'Tarragona, Spain');
  assert.equal(zonaPrincipal({ zona: 'Girona, Spain', codigoPostal: '28001' }), 'Girona, Spain');
});
