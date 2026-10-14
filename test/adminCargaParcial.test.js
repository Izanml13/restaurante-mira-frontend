import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

for (const archivo of ['src/components/Admin.jsx', 'src/components/ops/OpsIncidencias.jsx']) {
 test(`${archivo}: fallar resueltas conserva pendientes y negocios`, async () => {
  const source = fs.readFileSync(new URL(`../${archivo}`, import.meta.url), 'utf8');
  const expresion = source.match(/Promise\.all\(\[listarPendientes\(\)[^\n]+\]\)/)?.[0];
  assert.ok(expresion);
  const resultado = await vm.runInNewContext(expresion, {
   listarPendientes: async () => [{ id: 'p1' }],
   listarNegociosPendientes: async () => [{ id: 'n1' }],
   listarResueltas: async () => { throw new Error('Historial caído'); },
  });
  assert.equal(resultado[0][0].id, 'p1'); assert.equal(resultado[1][0].id, 'n1'); assert.equal(resultado[2].length, 0);
 });
}
