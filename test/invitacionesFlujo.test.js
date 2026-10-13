import test from 'node:test';
import assert from 'node:assert/strict';
import { invitationsApi } from '../src/services/api.js';
import { api } from '../src/services/httpClient.js';

test('crear y recuperar invitaciones ofrece enlaces de registro compartibles', async () => {
 const post=api.post,get=api.get,windowOriginal=globalThis.window;
 globalThis.window={location:{origin:'https://mira.test'}};
 api.post=async()=>({id:'i1',codigo:'ABC123',email:'amigo@test.local',estado:'pendiente'});
 api.get=async()=>({enviadas:[{id:'i1',codigo:'ABC123',emailInvitado:'amigo@test.local'}],aceptadas:0,puntosTotales:0});
 try {
  const creada=await invitationsApi.create('amigo@test.local');
  assert.equal(creada.link,'https://mira.test/#/registro?invite=ABC123');
  assert.equal(creada.emailInvitado,'amigo@test.local');
  assert.equal((await invitationsApi.getMy()).enviadas[0].link,creada.link);
 } finally {api.post=post;api.get=get;globalThis.window=windowOriginal;}
});
