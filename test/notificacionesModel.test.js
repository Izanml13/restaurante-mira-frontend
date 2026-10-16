import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoNotificaciones, debeRegistrarAlRecuperar } from '../mobile/src/models/notificacionesModel.js';

const aceptado = { estado: 'aceptado', version: 1, fecha: '2026-10-16T00:00:00.000Z' };
const rechazado = { ...aceptado, estado: 'rechazado' };
const bloqueado = { status: 'denied', canAskAgain: false };

test('sin decidir o «Ahora no» y se puede preguntar: desactivadas', () => {
  assert.equal(estadoNotificaciones(null, { status: 'undetermined', canAskAgain: true }), 'desactivadas');
  assert.equal(estadoNotificaciones(rechazado, { status: 'denied', canAskAgain: true }), 'desactivadas');
  assert.equal(estadoNotificaciones(rechazado, { status: 'granted' }), 'desactivadas', 'rechazado manda aunque haya permiso');
});

test('aceptado con permiso: activas', () => {
  assert.equal(estadoNotificaciones(aceptado, { status: 'granted', canAskAgain: true }), 'activas');
});

test('aceptado del perfil en un móvil nuevo, sin permiso: falta permiso', () => {
  assert.equal(estadoNotificaciones(aceptado, { status: 'undetermined', canAskAgain: true }), 'faltaPermiso');
  assert.equal(estadoNotificaciones(aceptado, { status: 'denied', canAskAgain: true }), 'faltaPermiso');
  assert.equal(estadoNotificaciones(aceptado, null), 'faltaPermiso');
});

test('bloqueado por el sistema: siempre «Abrir ajustes», también tras rechazar (revisión de Codex)', () => {
  assert.equal(estadoNotificaciones(aceptado, bloqueado), 'bloqueado');
  assert.equal(estadoNotificaciones(rechazado, bloqueado), 'bloqueado');
  assert.equal(estadoNotificaciones(null, bloqueado), 'bloqueado');
});

test('volver de Ajustes con el permiso concedido registra el dispositivo solo si estaba aceptado y antes no había permiso', () => {
  assert.equal(debeRegistrarAlRecuperar(bloqueado, { status: 'granted' }, aceptado), true);
  assert.equal(debeRegistrarAlRecuperar({ status: 'undetermined' }, { status: 'granted' }, aceptado), true);
  assert.equal(debeRegistrarAlRecuperar({ status: 'granted' }, { status: 'granted' }, aceptado), false, 'ya estaba concedido');
  assert.equal(debeRegistrarAlRecuperar(bloqueado, { status: 'granted' }, rechazado), false, 'no registra si lo rechazó');
  assert.equal(debeRegistrarAlRecuperar(null, { status: 'granted' }, aceptado), false, 'primera consulta: de eso se ocupa useAuth');
  assert.equal(debeRegistrarAlRecuperar(bloqueado, bloqueado, aceptado), false);
});
