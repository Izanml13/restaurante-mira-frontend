import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InvitacionEmailEstado from '../src/components/points/InvitacionEmailEstado.js';
import useInviteStore from '../src/stores/useInviteStore.js';
import { invitationsApi } from '../src/services/api.js';
import es from '../src/i18n/es.js';
import ca from '../src/i18n/ca.js';
import en from '../src/i18n/en.js';

function render(emailEstado, dict = es) {
 return renderToStaticMarkup(createElement(InvitacionEmailEstado, { emailEstado, t: (key) => key.split('.').reduce((v, k) => v[k], dict) }));
}
test('renderiza en la invitación el aviso de dirección inexistente y el envío fallido', () => {
 assert.match(render('inexistente'), /No existe la dirección, compruebe antes de volver a enviar/);
 assert.match(render('no_enviado'), /El correo no se pudo enviar/);
 assert.match(render('inexistente'), /role="status"/);
});
test('etiquetas traducidas es, ca y en; sin aviso para enviado o registros antiguos', () => {
 for (const dict of [es, ca, en]) {
  assert.ok(render('no_enviado', dict).includes(dict.points.inviteNotSent));
  assert.ok(render('inexistente', dict).includes(dict.points.inviteInvalidEmail));
 }
 assert.equal(render('enviado'), ''); assert.equal(render(undefined), '');
});

test('BUG-122: al recargar la lista tras error de Brevo renderiza no_enviado sin perder el enlace', async () => {
 const original = invitationsApi.getMy;
 const anterior = useInviteStore.getState();
 invitationsApi.getMy = async () => ({ enviadas: [{ id: 'error-brevo', emailEstado: 'no_enviado', messageId: '<id@brevo>', link: 'https://mira.test/#/registro?invite=ABC123' }], invitaciones: [], aceptadas: 0, puntosTotales: 0 });
 try {
  await useInviteStore.getState().fetchMyInvites();
  const inv = useInviteStore.getState().enviadas[0];
  assert.match(render(inv.emailEstado), /El correo no se pudo enviar/);
  assert.ok(inv.link.endsWith('invite=ABC123')); assert.equal(inv.messageId, '<id@brevo>');
 } finally { invitationsApi.getMy = original; useInviteStore.setState(anterior); }
});
