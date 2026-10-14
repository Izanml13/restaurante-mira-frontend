import test from 'node:test';
import assert from 'node:assert/strict';
import useInviteStore from '../src/stores/useInviteStore.js';
import { invitationsApi } from '../src/services/api.js';
import { emailInvitacionValido } from '../src/services/invitacionEmail.js';

test('solo comprueba formato del email, sin consultar la existencia del buzón', () => {
 assert.equal(emailInvitacionValido(' amigo@no-existe.test '), true);
 for (const email of ['', 'amigo', 'a@', 'a b@c.test']) assert.equal(emailInvitacionValido(email), false);
});
test('rehidrata la lista desde API tras perder el estado local', async () => {
 const get = invitationsApi.getMy;
 invitationsApi.getMy = async () => ({ enviadas: [{ id: 'i1', emailInvitado: 'a@b.test' }], aceptadas: 1, puntosTotales: 200 });
 try {
  useInviteStore.setState({ enviadas: [] });
  await useInviteStore.getState().fetchMyInvites();
  assert.equal(useInviteStore.getState().enviadas[0].id, 'i1');
  assert.equal(useInviteStore.getState().puntosTotales, 200);
 } finally { invitationsApi.getMy = get; }
});
test('una carga atrasada no borra una invitación recién creada', async () => {
 const get = invitationsApi.getMy, create = invitationsApi.create;
 let responder;
 invitationsApi.getMy = () => new Promise((resolve) => { responder = resolve; });
 invitationsApi.create = async () => ({ id: 'nueva' });
 try {
  const carga = useInviteStore.getState().fetchMyInvites();
  await useInviteStore.getState().createInvite('a@b.test');
  responder({ enviadas: [], aceptadas: 0, puntosTotales: 0 }); await carga;
  assert.equal(useInviteStore.getState().enviadas[0].id, 'nueva');
 } finally { invitationsApi.getMy = get; invitationsApi.create = create; }
});

test('cerrar sesión invalida respuestas pendientes y borra datos de la cuenta anterior', async () => {
 const get = invitationsApi.getMy;
 let responder;
 invitationsApi.getMy = () => new Promise((resolve) => { responder = resolve; });
 try {
  const carga = useInviteStore.getState().fetchMyInvites();
  useInviteStore.getState().reset();
  responder({ enviadas: [{ id: 'otra-cuenta' }], aceptadas: 1, puntosTotales: 200 }); await carga;
  assert.deepEqual(useInviteStore.getState().enviadas, []);
  assert.equal(useInviteStore.getState().puntosTotales, 0);
 } finally { invitationsApi.getMy = get; }
});
