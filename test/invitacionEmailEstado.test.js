import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InvitacionEmailEstado from '../src/components/points/InvitacionEmailEstado.js';
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
