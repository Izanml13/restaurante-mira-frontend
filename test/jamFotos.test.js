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

test('una versión recibida durante la petición se recupera aunque la respuesta traiga una anterior', async () => {
  const { sync, peticiones } = preparar();
  let mostrada = null;
  const alRefrescar = (s) => { mostrada = sync.aplicar(s, alRefrescar); };
  sync.aplicar(sala({ portada: 'p1', foto: 'f1', fotosV: 1 }), alRefrescar);
  sync.aplicar(sala({ fotosV: 2 }), alRefrescar);
  sync.aplicar(sala({ fotosV: 3 }), alRefrescar);
  assert.equal(peticiones.length, 1);
  peticiones[0].ok(sala({ portada: 'p2', foto: 'f2', fotosV: 2 }));
  await new Promise((r) => setTimeout(r));
  assert.equal(mostrada.portada, 'p2');
  assert.equal(peticiones.length, 2, 'falta v3: se pide otra vez');
  peticiones[1].ok(sala({ portada: 'p3', foto: 'f3', fotosV: 3 }));
  await new Promise((r) => setTimeout(r));
  assert.equal(mostrada.portada, 'p3');
  assert.equal(peticiones.length, 2, 'al día: no se pide más');
});

test('una versión del directo anterior a la carga inicial se pide al terminar esa carga', () => {
  const { sync, peticiones } = preparar();
  sync.aplicar(sala({ fotosV: 2 }), () => {});
  assert.equal(peticiones.length, 0);
  sync.aplicar(sala({ portada: 'p1', foto: 'f1', fotosV: 1 }), () => {});
  assert.equal(peticiones.length, 1);
});

test('un error no reintenta en bucle', async () => {
  const peticiones = [];
  const sync = crearSincronizadorFotos(() => { peticiones.push(1); return Promise.reject(new Error('red')); });
  sync.aplicar(sala({ portada: 'p1', foto: 'f1', fotosV: 1 }), () => {});
  sync.aplicar(sala({ fotosV: 2 }), () => {});
  await new Promise((r) => setTimeout(r));
  assert.equal(peticiones.length, 1);
});
