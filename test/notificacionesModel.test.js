import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoNotificaciones } from '../mobile/src/models/notificacionesModel.js';

const aceptado = { estado: 'aceptado', version: 1, fecha: '2026-10-16T00:00:00.000Z' };
const rechazado = { ...aceptado, estado: 'rechazado' };

test('sin decidir o «Ahora no»: desactivadas (se pueden activar después)', () => {
  assert.equal(estadoNotificaciones(null, { status: 'undetermined' }), 'desactivadas');
  assert.equal(estadoNotificaciones(rechazado, { status: 'granted' }), 'desactivadas');
});

test('aceptado con permiso: activas', () => {
  assert.equal(estadoNotificaciones(aceptado, { status: 'granted', canAskAgain: true }), 'activas');
});

test('aceptado del perfil en un móvil nuevo, sin permiso: falta permiso; si el sistema no deja preguntar: bloqueado', () => {
  assert.equal(estadoNotificaciones(aceptado, { status: 'undetermined', canAskAgain: true }), 'faltaPermiso');
  assert.equal(estadoNotificaciones(aceptado, { status: 'denied', canAskAgain: true }), 'faltaPermiso');
  assert.equal(estadoNotificaciones(aceptado, { status: 'denied', canAskAgain: false }), 'bloqueado');
  assert.equal(estadoNotificaciones(aceptado, null), 'faltaPermiso');
});
