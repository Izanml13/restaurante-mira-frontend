import test from 'node:test';
import assert from 'node:assert/strict';
import { leer, decidir, fusionar, pasoPendiente, normalizar, CLAVES, VERSIONES } from '../src/models/consentimientosModel.js';

const almacen = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), m }; };
const c = (estado, fecha, version = 1) => ({ estado, version, fecha });

test('decidir guarda solo estado, versión y fecha; leer lo devuelve', () => {
  const s = almacen();
  decidir(s, 'notificaciones', 'aceptado', new Date('2026-10-16T08:00:00Z'));
  assert.deepEqual(leer(s, 'notificaciones'), c('aceptado', '2026-10-16T08:00:00.000Z'));
  assert.deepEqual(Object.keys(JSON.parse(s.m.get(CLAVES.notificaciones))).sort(), ['estado', 'fecha', 'version']);
  assert.throws(() => decidir(s, 'ubicacion', 'quizas'));
  assert.throws(() => decidir(s, 'camara', 'aceptado'));
});

test('la ubicación usa la misma clave y formato que G03 (no se vuelve a preguntar tras actualizar)', () => {
  const s = almacen();
  s.setItem('mira:ubicacion', JSON.stringify({ estado: 'aceptado', version: 1, fecha: '2026-10-15T10:00:00.000Z' }));
  assert.equal(leer(s, 'ubicacion').estado, 'aceptado');
});

test('versión antigua, estado raro, fecha mala o dato corrupto: como si no hubiera decisión', () => {
  assert.equal(normalizar('ubicacion', c('aceptado', '2026-10-16T08:00:00Z', 0)), null);
  assert.equal(normalizar('ubicacion', c('quizas', '2026-10-16T08:00:00Z')), null);
  assert.equal(normalizar('ubicacion', c('aceptado', 'ayer')), null);
  const s = almacen(); s.setItem(CLAVES.ubicacion, '{roto');
  assert.equal(leer(s, 'ubicacion'), null);
  assert.equal(VERSIONES.notificaciones, 1);
});

test('fusionar: gana el más reciente y solo se copia lo necesario', () => {
  const viejo = '2026-10-10T00:00:00.000Z'; const nuevo = '2026-10-16T00:00:00.000Z';
  const { aLocal, aPerfil } = fusionar(
    { ubicacion: c('rechazado', nuevo), notificaciones: c('aceptado', viejo) },
    { ubicacion: c('aceptado', viejo), notificaciones: c('rechazado', nuevo) },
  );
  assert.deepEqual(aPerfil, { ubicacion: c('rechazado', nuevo) });
  assert.deepEqual(aLocal, { notificaciones: c('rechazado', nuevo) });
  assert.deepEqual(fusionar({}, {}), { aLocal: {}, aPerfil: {} });
  assert.deepEqual(fusionar({ ubicacion: c('aceptado', viejo) }, null).aPerfil, { ubicacion: c('aceptado', viejo) });
  assert.deepEqual(fusionar({ ubicacion: c('aceptado', nuevo) }, { ubicacion: c('aceptado', nuevo) }), { aLocal: {}, aPerfil: {} });
});

test('pasoPendiente sigue el orden cookies → ubicación → notificaciones', () => {
  assert.equal(pasoPendiente({ cookiesDecididas: false }), 'cookies');
  assert.equal(pasoPendiente({ cookiesDecididas: true, ubicacion: null }), 'ubicacion');
  assert.equal(pasoPendiente({ cookiesDecididas: true, ubicacion: c('rechazado', 'x'), notificaciones: null }), 'notificaciones');
  assert.equal(pasoPendiente({ cookiesDecididas: true, ubicacion: {}, notificaciones: {} }), null);
});

import { sincronizar } from '../src/models/consentimientosModel.js';

function escenario({ local = {}, remoto = {} } = {}) {
  const estado = { local: { ...local }, subidas: [], vigente: true, resolverGet: null };
  const deps = {
    leerRemoto: () => new Promise((ok) => { estado.resolverGet = () => ok(remoto); }),
    leerLocal: () => ({ ...estado.local }),
    escribirLocal: (t, v) => { estado.local[t] = v; },
    subir: async (c) => { estado.subidas.push(c); },
    sigueVigente: () => estado.vigente,
  };
  return { estado, deps };
}
const tic = () => new Promise((r) => setImmediate(r));
const viejo = { estado: 'aceptado', version: 1, fecha: '2026-10-10T00:00:00.000Z' };
const nuevo = { estado: 'rechazado', version: 1, fecha: '2026-10-16T00:00:00.000Z' };

test('sincronizar con la sesión vigente: baja lo del perfil y sube lo del dispositivo', async () => {
  const { estado, deps } = escenario({ local: { ubicacion: nuevo }, remoto: { notificaciones: viejo } });
  const p = sincronizar(deps); await tic(); estado.resolverGet();
  assert.equal(await p, true);
  assert.deepEqual(estado.local.notificaciones, viejo);
  assert.deepEqual(estado.subidas, [{ ubicacion: nuevo }]);
});

test('cambio de cuenta antes de que llegue el GET de la anterior: no toca nada', async () => {
  const { estado, deps } = escenario({ local: { ubicacion: nuevo }, remoto: { notificaciones: viejo } });
  const p = sincronizar(deps); await tic();
  estado.vigente = false; // salir o entrar con otra cuenta
  estado.resolverGet();
  assert.equal(await p, false);
  assert.equal(estado.local.notificaciones, undefined, 'no se aplica el perfil de la cuenta anterior');
  assert.deepEqual(estado.subidas, [], 'no se sube nada con la sesión nueva');
});

test('cambio de cuenta después del GET: lo ya leído no se sube con la sesión nueva', async () => {
  const { estado, deps } = escenario({ local: { ubicacion: nuevo }, remoto: {} });
  deps.escribirLocal = (t, v) => { estado.local[t] = v; estado.vigente = false; };
  deps.leerRemoto = async () => ({ notificaciones: viejo });
  assert.equal(await sincronizar(deps), false);
  assert.deepEqual(estado.subidas, []);
});

test('sin sesión desde el principio o con error de red: no hace nada', async () => {
  const a = escenario(); a.estado.vigente = false;
  assert.equal(await sincronizar(a.deps), false);
  const b = escenario(); b.deps.leerRemoto = async () => { throw new Error('red'); };
  assert.equal(await sincronizar(b.deps), false);
  assert.deepEqual(b.estado.subidas, []);
});
