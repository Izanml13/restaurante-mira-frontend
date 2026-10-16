import test from 'node:test';
import assert from 'node:assert/strict';
import { alVolverAPrimerPlano } from '../mobile/src/services/primerPlano.js';

function appStateFalso(inicial = 'active') {
  const A = { currentState: inicial, oyente: null, quitados: 0 };
  A.addEventListener = (_e, f) => { A.oyente = f; return { remove: () => { A.quitados++; A.oyente = null; } }; };
  A.cambiar = (e) => { A.currentState = e; A.oyente?.(e); };
  return A;
}

test('ida y vuelta a Ajustes: avisa al volver a primer plano, una vez por vuelta', () => {
  const A = appStateFalso('active'); let n = 0;
  alVolverAPrimerPlano(A, () => { n++; });
  A.cambiar('inactive'); A.cambiar('background'); A.cambiar('active');
  assert.equal(n, 1);
  A.cambiar('active');
  assert.equal(n, 1, 'seguir en primer plano no vuelve a avisar');
  A.cambiar('background'); A.cambiar('active');
  assert.equal(n, 2);
});

test('darse de baja deja de avisar', () => {
  const A = appStateFalso('active'); let n = 0;
  const baja = alVolverAPrimerPlano(A, () => { n++; });
  baja();
  assert.equal(A.quitados, 1);
  A.cambiar('background'); A.cambiar('active');
  assert.equal(n, 0);
});
