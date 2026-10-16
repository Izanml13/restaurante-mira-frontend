import test from 'node:test';
import assert from 'node:assert/strict';
import {
  distanciaM, debeConsultar, filtrarNuevos, leerVistos, guardarVistos, INTERVALO_MS,
  soloAvisables, leerFavoritosAvisos, CLAVE_FAVS_AVISOS,
} from '../src/models/avisosOfertasModel.js';

const P = { lat: 41.3874, lng: 2.1686 };
const r = (id, nivel) => ({ restaurante: { id: String(id) }, oferta: { id: `o${id}` }, nivel: { distancia: nivel } });

function memoria() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) };
}

test('distanciaM: ~111 m por milésima de grado de latitud', () => {
  const d = distanciaM(P, { lat: P.lat + 0.001, lng: P.lng });
  assert.ok(d > 105 && d < 116, `d=${d}`);
});

test('debeConsultar: primera vez, a los 30 s o tras 50 m; no antes', () => {
  assert.equal(debeConsultar(null, P, 0), true);
  assert.equal(debeConsultar(null, null, 0), false);
  const ultima = { ...P, t: 1000 };
  assert.equal(debeConsultar(ultima, P, 1000 + INTERVALO_MS - 1), false);
  assert.equal(debeConsultar(ultima, P, 1000 + INTERVALO_MS), true);
  assert.equal(debeConsultar(ultima, { lat: P.lat + 0.0005, lng: P.lng }, 2000), true); // ~55 m
  assert.equal(debeConsultar(ultima, { lat: P.lat + 0.0002, lng: P.lng }, 2000), false); // ~22 m
});

test('filtrarNuevos: 1000, 500, 100 y 20 una sola vez cada uno al acercarse', () => {
  let vistos = new Set();
  const avisados = [];
  for (const nivel of [1000, 1000, 500, 500, 100, 100, 20, 20]) {
    const res = filtrarNuevos([r(1, nivel)], vistos);
    vistos = res.vistos;
    avisados.push(...res.nuevos.map((x) => x.nivel.distancia));
  }
  assert.deepEqual(avisados, [1000, 500, 100, 20]);
});

test('filtrarNuevos: al alejarse no repite un nivel peor', () => {
  let { vistos } = filtrarNuevos([r(1, 100)], new Set());
  const res = filtrarNuevos([r(1, 500)], vistos);
  assert.equal(res.nuevos.length, 0);
  vistos = res.vistos;
  assert.equal(filtrarNuevos([r(1, 100)], vistos).nuevos.length, 0);
});

test('filtrarNuevos: restaurantes distintos son independientes y se ignoran datos rotos', () => {
  const res = filtrarNuevos([r(1, 500), r(2, 500), { restaurante: {} }, null], new Set());
  assert.deepEqual(res.nuevos.map((x) => x.restaurante.id), ['1', '2']);
});

test('vistos: se guardan sin posiciones y se reinician al cambiar de día', () => {
  const s = memoria();
  const hoy = new Date(2026, 9, 15, 12).getTime();
  guardarVistos(s, new Set(['1:500']), hoy);
  assert.deepEqual([...leerVistos(s, hoy)], ['1:500']);
  assert.doesNotMatch(s.getItem('mira:avisosOfertas'), /lat|lng/);
  assert.equal(leerVistos(s, new Date(2026, 9, 16, 9).getTime()).size, 0);
  s.setItem('mira:avisosOfertas', '{roto');
  assert.equal(leerVistos(s, hoy).size, 0);
});

test('G11: solo avisa de restaurantes partner o en favoritos', () => {
  const partner = { ...r(1, 1000), restaurante: { id: '1', partner: true } };
  const res = soloAvisables([partner, r(2, 500), r(3, 100)], ['3']);
  assert.deepEqual(res.map((x) => x.restaurante.id), ['1', '3']);
  assert.deepEqual(soloAvisables([r(2, 500)], []), []);
  assert.deepEqual(soloAvisables(null, ['1']), []);
});

test('G11: lee la copia de favoritos y tolera datos corruptos', () => {
  const mem = new Map();
  const s = { getItem: (k) => mem.get(k) ?? null };
  assert.deepEqual(leerFavoritosAvisos(s), []);
  mem.set(CLAVE_FAVS_AVISOS, '["a","b"]');
  assert.deepEqual(leerFavoritosAvisos(s), ['a', 'b']);
  mem.set(CLAVE_FAVS_AVISOS, '{roto');
  assert.deepEqual(leerFavoritosAvisos(s), []);
});

test('límite visual: solo se deduplican y cuentan los tres avisos mostrados', () => {
  const candidatos = [r(1, 100), r(2, 100), r(3, 100), r(4, 100), r(5, 100)];
  const primera = filtrarNuevos(candidatos, new Set(), 3);
  assert.deepEqual(primera.nuevos.map(x => x.restaurante.id), ['1', '2', '3']);
  assert.deepEqual([...primera.vistos], ['1:100', '2:100', '3:100']);
  // Los descartados no se pierden: pueden mostrarse y contarse en otra consulta.
  const segunda = filtrarNuevos(candidatos, primera.vistos, 3);
  assert.deepEqual(segunda.nuevos.map(x => x.restaurante.id), ['4', '5']);
  assert.equal(filtrarNuevos(candidatos, segunda.vistos, 3).nuevos.length, 0);
});
