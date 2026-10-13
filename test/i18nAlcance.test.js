/**
 * Guarda de regresión: toda llamada t('...') de los componentes tiene `t`
 * definido en su ámbito. Si no, el build pasa pero la pantalla rompe al abrirse
 * ("t is not defined"), y muchos paneles solo se ven con sesión de admin.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import traverseMod from '@babel/traverse';

const traverse = traverseMod.default || traverseMod;
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

function jsx(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) jsx(p, acc);
    else if (e.name.endsWith('.jsx')) acc.push(p);
  }
  return acc;
}

test('cada t(...) usado en los componentes tiene t definido en su ámbito', () => {
  const fallos = [];
  for (const archivo of jsx(raiz)) {
    const ast = parse(fs.readFileSync(archivo, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
    traverse(ast, {
      CallExpression(p) {
        if (p.node.callee.type === 'Identifier' && p.node.callee.name === 't' && !p.scope.hasBinding('t')) {
          fallos.push(`${path.relative(raiz, archivo)}:${p.node.loc.start.line}`);
        }
      },
    });
  }
  assert.deepEqual(fallos, [], `t sin definir en: ${fallos.join(', ')}`);
});
