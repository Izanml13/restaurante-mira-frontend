import test from 'node:test';
import assert from 'node:assert/strict';
import { validarResolucion } from '../src/services/incidenciaResolucion.js';
import { resolverIncidencia } from '../src/services/incidenciaApi.js';
import { api } from '../src/services/httpClient.js';

const datos = { propuestaResolucion: ' Llamar ', solucion: ' Abono ', encargado: ' Ana ' };

test('normaliza la resolución sin incorporar otros campos', () => {
  assert.deepEqual(validarResolucion({ ...datos, estado: 'otro' }), { propuestaResolucion: 'Llamar', solucion: 'Abono', encargado: 'Ana' });
});

test('rechaza cada campo ausente, vacío o demasiado largo', () => {
  for (const campo of Object.keys(datos)) {
    for (const valor of [undefined, '', '  ', 'x'.repeat(campo === 'encargado' ? 201 : 4001)]) {
      assert.throws(() => validarResolucion({ ...datos, [campo]: valor }));
    }
  }
});

test('el servicio envía los campos y no llama a la API con datos incompletos', async () => {
  const original = api.put;
  const llamadas = [];
  api.put = async (...args) => { llamadas.push(args); };
  try {
    await assert.rejects(resolverIncidencia('id', {}));
    assert.equal(llamadas.length, 0);
    await resolverIncidencia('a/b', datos);
    assert.deepEqual(llamadas, [['/v1/contactos/a%2Fb/resolve', validarResolucion(datos)]]);
  } finally {
    api.put = original;
  }
});
