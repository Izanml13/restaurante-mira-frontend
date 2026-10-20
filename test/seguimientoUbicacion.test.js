import test from 'node:test';
import assert from 'node:assert/strict';
import { iniciarSeguimiento } from '../mobile/src/services/seguimientoUbicacion.js';

/** expo-location falso con cada espera controlable desde el test. */
function locationFalso() {
  const pend = {};
  const espera = (k) => new Promise((ok) => { pend[k] = ok; });
  const L = {
    Accuracy: { High: 4 },
    watches: 0, removes: 0, callbackPos: null, pedidos: 0, consultas: 0,
    requestForegroundPermissionsAsync: () => { L.pedidos++; return espera('permiso'); },
    getForegroundPermissionsAsync: () => { L.consultas++; return espera('permiso'); },
    hasServicesEnabledAsync: () => espera('servicios'),
    watchPositionAsync: (_o, cb) => { L.watches++; L.callbackPos = cb; return espera('sub'); },
  };
  return { L, pend, sub: () => ({ remove: () => { L.removes++; } }) };
}
const tic = () => new Promise((r) => setImmediate(r));

function arrancar(L, { pedir = true } = {}) {
  const estado = { activa: true, posiciones: [], errores: [], concedido: 0 };
  const parar = iniciarSeguimiento(L, {
    pedir,
    onConcedido: () => { estado.concedido++; },
    sigueActiva: () => estado.activa,
    onPosicion: (c) => estado.posiciones.push(c),
    onError: (e) => estado.errores.push(e),
  });
  return { estado, desactivar: () => { estado.activa = false; parar(); } };
}

test('flujo normal: permiso, servicios, suscripción y posiciones; al parar se elimina', async () => {
  const { L, pend, sub } = locationFalso();
  const { estado, desactivar } = arrancar(L);
  pend.permiso({ status: 'granted' }); await tic();
  pend.servicios(true); await tic();
  pend.sub(sub()); await tic();
  L.callbackPos({ coords: { latitude: 1, longitude: 2 } });
  assert.equal(estado.posiciones.length, 1);
  desactivar();
  assert.equal(L.removes, 1);
});

test('desactivar mientras se pide el permiso: no arranca ningún seguimiento', async () => {
  const { L, pend } = locationFalso();
  const { desactivar } = arrancar(L);
  desactivar();
  pend.permiso({ status: 'granted' }); await tic();
  assert.equal(L.watches, 0);
});

test('desactivar mientras se comprueban los servicios: no arranca (P2 de Codex)', async () => {
  const { L, pend } = locationFalso();
  const { estado, desactivar } = arrancar(L);
  pend.permiso({ status: 'granted' }); await tic();
  desactivar();
  pend.servicios(true); await tic();
  assert.equal(L.watches, 0);
  assert.deepEqual(estado.errores, []);
});

test('desactivar mientras se crea la suscripción: se elimina al llegar y los avisos tardíos se ignoran', async () => {
  const { L, pend, sub } = locationFalso();
  const { estado, desactivar } = arrancar(L);
  pend.permiso({ status: 'granted' }); await tic();
  pend.servicios(true); await tic();
  desactivar();
  L.callbackPos({ coords: { latitude: 40.4, longitude: -3.7 } }); // llega antes que la suscripción
  pend.sub(sub()); await tic();
  assert.equal(L.removes, 1);
  assert.deepEqual(estado.posiciones, [], 'no vuelve a guardar posición tras desactivar');
});

test('permiso denegado o servicios apagados: error y sin seguimiento', async () => {
  const a = locationFalso(); const ra = arrancar(a.L);
  a.pend.permiso({ status: 'denied', canAskAgain: true }); await tic();
  assert.deepEqual(ra.estado.errores, ['permisoPendiente']);
  const b = locationFalso(); const rb = arrancar(b.L);
  b.pend.permiso({ status: 'granted' }); await tic(); b.pend.servicios(false); await tic();
  assert.deepEqual(rb.estado.errores, ['errorNoDisponible']);
  assert.equal(a.L.watches + b.L.watches, 0);
});

test('C02: al abrir la app solo consulta el permiso, no lo pide', async () => {
  const { L, pend, sub } = locationFalso();
  const { estado } = arrancar(L, { pedir: false });
  pend.permiso({ status: 'granted' }); await tic();
  pend.servicios(true); await tic();
  pend.sub(sub()); await tic();
  assert.equal(L.pedidos, 0);
  assert.equal(L.consultas, 1);
  assert.equal(L.watches, 1);
  assert.equal(estado.concedido, 0, 'solo avisa a las demás pantallas si lo acaba de pedir');
});

test('C02: sin permiso al abrir → «pendiente»; bloqueado por el sistema → «bloqueado»', async () => {
  const a = locationFalso(); const ra = arrancar(a.L, { pedir: false });
  a.pend.permiso({ status: 'denied', canAskAgain: true }); await tic();
  assert.deepEqual(ra.estado.errores, ['permisoPendiente']);
  const b = locationFalso(); const rb = arrancar(b.L, { pedir: true });
  b.pend.permiso({ status: 'denied', canAskAgain: false }); await tic();
  assert.deepEqual(rb.estado.errores, ['permisoBloqueado']);
  assert.equal(a.L.watches + b.L.watches, 0);
});

test('C02: al pedirlo y concederse, avisa para que las demás pantallas vuelvan a consultar', async () => {
  const { L, pend } = locationFalso();
  const { estado } = arrancar(L, { pedir: true });
  pend.permiso({ status: 'granted' }); await tic();
  assert.equal(L.pedidos, 1);
  assert.equal(estado.concedido, 1);
});
