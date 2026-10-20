import test from 'node:test';
import assert from 'node:assert/strict';
import { compartirArchivo } from '../mobile/src/services/compartirArchivo.js';
import { prepararAvisos, AUSENCIA_VISITA_MS, debeConsultar, soloAvisables } from '../mobile/src/models/avisosOfertasModel.js';
import { ofertaParaLlegada } from '../mobile/src/models/accesoLlegada.js';
import { pestanaActiva } from '../mobile/src/components/shell/rutas.js';
import { construirBody, normalizarRespuesta } from '../mobile/src/services/aiPayload.js';
import { construirBody as bodyWeb } from '../src/services/aiPayload.js';
const ahora = new Date(2026, 9, 16, 12).getTime();
const oferta = (id = 'r1', distanciaM = 10, nivel = 20) => ({ restaurante: { id }, oferta: { id: `o-${id}` }, distanciaM, nivel: { distancia: nivel } });

test('BUG-138: Sharing ausente, incompleto o con error nunca rompe la pantalla', async () => {
  for (const modulo of [undefined, {}, { isAvailableAsync: async () => false }, { isAvailableAsync: async () => true },
    { isAvailableAsync: async () => { throw Error('nativo no disponible'); } }, () => { throw Error('Cannot find native module ExpoSharing'); }]) {
    assert.equal(await compartirArchivo(modulo, 'file://a.csv'), false);
  }
  const llamadas = [];
  const modulo = { isAvailableAsync: async () => true, shareAsync: async (...args) => llamadas.push(args) };
  assert.equal(await compartirArchivo(async () => modulo, 'file://a.csv', { mimeType: 'text/csv' }), true);
  assert.deepEqual(llamadas, [['file://a.csv', { mimeType: 'text/csv' }]]);
  assert.equal(await compartirArchivo({ ...modulo, shareAsync: async () => { throw Error('cancelado'); } }, 'file://a'), false);
});

test('BUG-139: presencia continua y rebotes GPS no repiten avisos, acercarse sí mejora de nivel', () => {
  let estado;
  const enviados = [];
  for (const [i, [metros, nivel]] of [[900, 1000], [400, 500], [70, 100], [10, 20], [30, 100], [15, 20], [70, 100], [10, 20]].entries()) {
    const r = prepararAvisos([oferta('r1', metros, nivel)], estado, ahora + i * 30000);
    enviados.push(...r.nuevos.map(o => o.nivel.distancia)); estado = r.estado;
  }
  assert.deepEqual(enviados, [1000, 500, 100, 20]);
  assert.equal(prepararAvisos([oferta()], estado, ahora + 3600000).nuevos.length, 0);
});

test('BUG-139: rearma tras otra visita, solo para el restaurante abandonado', () => {
  let estado = prepararAvisos([oferta(), oferta('r2')], null, ahora).estado;
  estado = prepararAvisos([oferta('r1', 200, 500), oferta('r2')], estado, ahora + 30000).estado;
  const copia = JSON.stringify(estado);
  const vuelve = prepararAvisos([oferta(), oferta('r2')], estado, ahora + 30000 + AUSENCIA_VISITA_MS);
  assert.deepEqual(vuelve.nuevos.map(o => o.restaurante.id), ['r1']);
  assert.equal(JSON.stringify(estado), copia, 'el modelo no modifica el estado de entrada');
  assert.equal(prepararAvisos([oferta()], vuelve.estado, ahora + 1200000).nuevos.length, 0);
});

test('BUG-139: una salida breve no rearma y desaparecer de cerca durante diez minutos sí', () => {
  const inicial = prepararAvisos([oferta()], null, ahora).estado;
  const fuera = prepararAvisos([], inicial, ahora + 30000).estado;
  assert.equal(prepararAvisos([oferta()], fuera, ahora + 60000).nuevos.length, 0);
  assert.equal(prepararAvisos([oferta()], fuera, ahora + 30000 + AUSENCIA_VISITA_MS).nuevos.length, 1);
});

test('BUG-139: cambia de día incluso quieto; lo excluido por el límite no queda marcado', () => {
  const primero = prepararAvisos([oferta(), oferta('r2')], null, ahora, 1);
  assert.deepEqual(primero.estado.claves, ['r1~o-r1:20']);
  assert.equal(prepararAvisos([oferta(), oferta('r2')], primero.estado, ahora + 30000, 1).nuevos[0].restaurante.id, 'r2');
  assert.equal(prepararAvisos([oferta()], primero.estado, ahora + 86400000).nuevos.length, 1);
  assert.equal(debeConsultar({ lat: 1, lng: 1, t: ahora }, { lat: 1, lng: 1 }, ahora + 30000), true);
  assert.doesNotMatch(JSON.stringify(primero.estado), /lat|lng|distanciaM/);
  assert.deepEqual(soloAvisables([oferta(), oferta('r2')], ['r1']).map(o => o.restaurante.id), ['r1']);
});

test('BUG-142: rutas raíz, barra final, query y subpantallas conservan una pestaña activa', () => {
  const casos = { '/': 'home', '/mapa/': 'mapa', '/reservas?dia=1': 'reservas', '/favoritos': 'favoritos', '/cuenta': 'cuenta',
    '/puntos/historial': 'cuenta', '/mensajes': 'cuenta', '/login': 'cuenta', '/detalle': 'home', '/llegada': 'home', '/mira': 'home' };
  for (const [path, activa] of Object.entries(casos)) assert.equal(pestanaActiva(path), activa);
});

test('BUG-143: solo se ofrece QR para ese restaurante y una oferta activa dentro de 50m', () => {
  const cerca = oferta('r1', 50);
  assert.equal(ofertaParaLlegada([oferta('r2'), cerca], 'r1'), cerca);
  for (const dato of [oferta('r1', 51), oferta('r1', -1), oferta('r1', NaN), { ...cerca, oferta: null }]) {
    assert.equal(ofertaParaLlegada([dato], 'r1'), null);
  }
  assert.equal(ofertaParaLlegada([], 'r1'), null);
});

test('BUG-144: petición nativa coincide con el contrato web, límites e idioma incluidos', () => {
  for (const lang of ['es', 'ca', 'en', 'fr']) {
    const turno = { message: ' Hola '.repeat(600), history: Array.from({ length: 15 }, (_, i) => ({ role: i % 2 ? 'model' : 'user', content: `turno ${i}` })), lang, confirmId: '12345678-1234-4234-9234-123456789012' };
    assert.deepEqual(construirBody(turno), bodyWeb(turno));
  }
  assert.deepEqual(construirBody({ message: 'Hola', confirmId: 'mal', history: [{ role: 'system', content: 'no' }] }), { message: 'Hola' });
});

test('BUG-144: error de herramienta en HTTP 200 y confirmación solo por UUID estructurado', () => {
  const res = normalizarRespuesta({ reply: 'Confirma', actions: [{ result: { ok: false, message: 'No hay plazas' }, args: { email: 'privado' } }], needsConfirm: { confirmId: '12345678-1234-4234-9234-123456789012', summary: 'Reservar mesa', payload: { privado: true } } });
  assert.deepEqual(res.errores, ['No hay plazas']);
  assert.deepEqual(Object.keys(res.needsConfirm), ['confirmId', 'summary']);
  assert.doesNotMatch(JSON.stringify(res), /privado|email/);
  assert.equal(normalizarRespuesta({ reply: 'confirmId: inventado', needsConfirm: { confirmId: 'falso' } }).needsConfirm, null);
  assert.equal(normalizarRespuesta(null).reply, '');
});
