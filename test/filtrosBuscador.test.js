import test from 'node:test';
import assert from 'node:assert/strict';
import { opcionesCocina, COCINAS } from '../src/models/restaurantModel.js';
import { filterRestaurants } from '../src/services/filterService.js';

test('opcionesCocina no repite tipos entre español, Yelp y mayúsculas', () => {
  const op = opcionesCocina([...COCINAS, 'Japanese', 'Sushi Bars', 'japonesa', 'Italian', 'Pizza', 'Mexican', 'Spanish', 'Vegan', 'Vegetarian', 'Barbeque', 'Fusion']);
  assert.equal(new Set(op).size, op.length);
  assert.equal(op.filter((c) => c === 'Japonesa').length, 1);
  assert.ok(op.includes('Fusión') && op.includes('Vegana') && !op.includes('Vegan') && !op.includes('Barbeque'));
  assert.ok(!op.includes('Japanese') && !op.includes('Sushi Bars') && !op.includes('Italian'));
});

test('filtrar por cocina encuentra la familia aunque la categoría venga en inglés', () => {
  const lista = [
    { id: 1, cocina: 'Sushi Bars', categorias: ['Sushi Bars', 'Japanese'] },
    { id: 2, cocina: 'Italian', categorias: ['Italian'] },
  ];
  assert.deepEqual(filterRestaurants(lista, { cocina: 'Japonesa' }).map((r) => r.id), [1]);
});

test('filtrar por zona agrupa cada local en su provincia', () => {
  const lista = [
    { id: 1, zona: 'Tarragona, Spain' },
    { id: 2, zona: 'Salou, Spain', coords: { lat: 41.077, lng: 1.131 } },
    { id: 3, zona: 'Barcelona, Spain' },
  ];
  assert.deepEqual(filterRestaurants(lista, { zona: 'Tarragona, Spain' }).map((r) => r.id), [1, 2]);
});
