import test from 'node:test';
import assert from 'node:assert/strict';
import { abrirRachaSiPendiente } from '../src/services/rachaEntrada.js';

function probar(datos, vigente = () => true) {
  const abiertas = [];
  return abrirRachaSiPendiente(async () => datos, (d) => abiertas.push(d), vigente).then((r) => ({ r, abiertas }));
}

test('abre la racha si la de hoy está sin reclamar', async () => {
  const { r, abiertas } = await probar({ yaReclamado: false, racha: { dias: 2 } });
  assert.equal(r, true);
  assert.equal(abiertas.length, 1);
});

test('no la abre si ya está reclamada o si la API falla', async () => {
  assert.equal((await probar({ yaReclamado: true })).abiertas.length, 0);
  assert.equal((await probar({ yaReclamado: false, error: true })).abiertas.length, 0);
});

test('ignora la respuesta tardía si la sesión se cerró o cambió mientras tanto', async () => {
  let vigente = true;
  let resolver;
  const abiertas = [];
  const pendiente = abrirRachaSiPendiente(() => new Promise((ok) => { resolver = ok; }), (d) => abiertas.push(d), () => vigente);
  vigente = false; // cierre de sesión antes de que llegue la respuesta
  resolver({ yaReclamado: false });
  assert.equal(await pendiente, false);
  assert.equal(abiertas.length, 0);
});
