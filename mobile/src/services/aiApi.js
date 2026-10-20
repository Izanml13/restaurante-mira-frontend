import * as Crypto from 'expo-crypto';
import { api } from './httpClient.js';
import { construirBody, TIMEOUT_MS } from './aiPayload.js';

export const nuevaClaveTurno = () => Crypto.randomUUID();

export async function enviarTurno({ signal, idempotencyKey, ...turno }) {
  const ctl = new AbortController();
  let agotado = false;
  const abortar = () => ctl.abort();
  if (signal?.aborted) abortar();
  else signal?.addEventListener('abort', abortar);
  const reloj = setTimeout(() => { agotado = true; ctl.abort(); }, TIMEOUT_MS);
  try {
    return await api.post('/v1/ai/agent', construirBody(turno), {
      auth: 'opcional', signal: ctl.signal,
      headers: { 'Idempotency-Key': idempotencyKey || nuevaClaveTurno() },
    });
  } catch (err) {
    if (agotado) throw Object.assign(new Error('timeout'), { name: 'TimeoutError' });
    throw err;
  } finally {
    clearTimeout(reloj);
    signal?.removeEventListener('abort', abortar);
  }
}
