/** Contrato de /v1/ai/agent, igual al web; la versión móvil inicial muestra texto. */
export const MAX_MENSAJE = 2000;
export const TIMEOUT_MS = 35000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function construirBody({ message, history, confirmId, lang }) {
  const body = { message: String(message ?? '').trim().slice(0, MAX_MENSAJE) };
  if (['es', 'ca', 'en'].includes(lang)) body.lang = lang;
  const h = (Array.isArray(history) ? history : [])
    .filter(m => m && ['user', 'model'].includes(m.role) && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.trim().slice(0, 4000) }))
    .filter(m => m.content).slice(-10);
  if (h.length) body.history = h;
  if (typeof confirmId === 'string' && UUID.test(confirmId)) body.confirmId = confirmId;
  return body;
}
export function normalizarRespuesta(data) {
  const nc = data?.needsConfirm;
  return {
    reply: typeof data?.reply === 'string' ? data.reply.slice(0, 4000) : '',
    // No ejecutar instrucciones del texto ni mostrar args/payload con datos privados.
    errores: (Array.isArray(data?.actions) ? data.actions : [])
      .filter(a => a?.result?.ok === false).slice(0, 30)
      .map(a => typeof a.result.message === 'string' ? a.result.message.slice(0, 500) : ''),
    needsConfirm: nc && typeof nc.confirmId === 'string' && UUID.test(nc.confirmId)
      ? { confirmId: nc.confirmId, summary: typeof nc.summary === 'string' ? nc.summary.slice(0, 300) : '' } : null,
  };
}
