import test from 'node:test';
import assert from 'node:assert/strict';
import { crearSincronizadorFotos } from '../src/services/jamFotos.js';

const sala = (extra) => ({ codigo: 'AAA111', participantes: [], ...extra });

function preparar() {
  const peticiones = [];
  const sync = crearSincronizadorFotos((codigo) => new Promise((ok) => peticiones.push({ codigo, ok })));
  return { sync, peticiones };
}

test('varios eventos de una versión nueva mientras la petición sigue en curso piden la sala una sola vez', async () => {
  const { sync, peticiones } = preparar();
  sync.aplicar(sala({ portada: 'p1', foto: 'f1', fotosV: 1 }), () => {});
  for (let i = 0; i < 5; i++) sync.aplicar(sala({ fotosV: 2 }), () => {});
  assert.equal(peticiones.length, 1);
  const recibidas = [];
  peticiones[0].ok(sala({ portada: 'p2', foto: 'f2', fotosV: 2 }));
  await new Promise((r) => setTimeout(r));
  // Tras la respuesta se puede volver a pedir si llega otra versión.
  sync.aplicar(sala({ fotosV: 3 }), (s) => recibidas.push(s));
  assert.equal(peticiones.length, 2);
});

test('el directo sin fotos conserva las últimas y una respuesta antigua no pisa una versión más nueva', () => {
  const { sync } = preparar();
  sync.aplicar(sala({ portada: 'p3', foto: 'f3', fotosV: 3 }), () => {});
  assert.equal(sync.aplicar(sala({ fotosV: 3 }), () => {}).portada, 'p3');
  const vieja = sync.aplicar(sala({ portada: 'p2', foto: 'f2', fotosV: 2 }), () => {});
  assert.equal(vieja.portada, 'p3');
});

test('no pide nada antes de la primera carga completa', () => {
  const { sync, peticiones } = preparar();
  sync.aplicar(sala({ fotosV: 4 }), () => {});
  assert.equal(peticiones.length, 0);
});
