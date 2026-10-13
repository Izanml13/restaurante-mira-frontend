import test from 'node:test';
import assert from 'node:assert/strict';
import { getDisponibilidad } from '../src/services/reservaApi.js';
import { api } from '../src/services/httpClient.js';

test('disponibilidad: si la API falla no se inventan plazas libres', async () => {
  const original = api.get;
  api.get = async () => { throw new Error('500'); };
  try {
    const d = await getDisponibilidad({ id: 'r1', maxReservasPorHora: 4 }, '2099-01-01', '13:00');
    assert.equal(d.desconocida, true);
    assert.equal(d.libres, null);
  } finally {
    api.get = original;
  }
});

test('disponibilidad: con respuesta de la API se devuelve tal cual', async () => {
  const original = api.get;
  api.get = async () => ({ limite: 4, ocupadas: 1, libres: 3 });
  try {
    assert.deepEqual(await getDisponibilidad({ id: 'r1' }, '2099-01-01', '13:00'), { limite: 4, ocupadas: 1, libres: 3 });
  } finally {
    api.get = original;
  }
});
