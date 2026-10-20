import test from 'node:test';
import assert from 'node:assert/strict';
import { recorteCentrado } from '../src/services/comprimirImagen.js';

test('recorteCentrado recorta los lados de una foto más ancha que la proporción', () => {
  assert.deepEqual(recorteCentrado(4000, 1000, 2.5), { sx: 750, sy: 0, sw: 2500, sh: 1000 });
});

test('recorteCentrado recorta arriba y abajo de una foto vertical para el perfil cuadrado', () => {
  assert.deepEqual(recorteCentrado(1000, 1600, 1), { sx: 0, sy: 300, sw: 1000, sh: 1000 });
});
