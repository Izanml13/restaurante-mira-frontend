/**
 * Reglas puras de las ofertas por distancia (G04, fase 1 del proyecto de
 * ofertas por geolocalización). Espejo de mira-api/src/modules/ofertas/logica.js:
 * 4 niveles fijos 1000/500/100/20 m, descuentos que nunca bajan al acercarse
 * y vigencia AAAA-MM-DD. Sin red: se prueba con node --test.
 */

/** Niveles fijos, de lejos a cerca. El de 20 m es la llegada (QR, fase 3). */
export const DISTANCIAS = [1000, 500, 100, 20];

/** Clave i18n del rótulo de cada nivel (ofertas.nivel1000 … ofertas.nivel20). */
export function claveNivel(distancia) {
  return `nivel${distancia}`;
}

/** Formulario vacío con los 4 niveles en orden. */
export function ofertaVacia() {
  return {
    titulo: '',
    activa: true,
    desde: null,
    hasta: null,
    niveles: DISTANCIAS.map((distancia) => ({ distancia, texto: '', descuentoPct: 0 })),
  };
}

/** Rellena el formulario a partir de una oferta de la API. */
export function ofertaAFormulario(o) {
  const niveles = DISTANCIAS.map((distancia) => {
    const n = (o.niveles || []).find((x) => Number(x.distancia) === distancia);
    return { distancia, texto: String(n?.texto ?? '').trim(), descuentoPct: Number(n?.descuentoPct) || 0 };
  });
  return { titulo: o.titulo ?? '', activa: Boolean(o.activa), desde: o.desde ?? null, hasta: o.hasta ?? null, niveles };
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** true si los descuentos no bajan al acercarse y el de llegada mejora al de 1 km. */
export function nivelesMejoran(niveles) {
  if (!Array.isArray(niveles) || niveles.length !== DISTANCIAS.length) return false;
  if (niveles.some((n, i) => Number(n?.distancia) !== DISTANCIAS[i])) return false;
  const empeora = niveles.some((n, i) => i > 0 && Number(n?.descuentoPct) < Number(niveles[i - 1]?.descuentoPct));
  return !empeora && Number(niveles[3]?.descuentoPct) > Number(niveles[0]?.descuentoPct);
}

/** { campo: [clave i18n relativa a ofertas.] o null — validación local antes de enviar. */
export function validarOferta(d) {
  const e = {};
  if (typeof d.titulo !== 'string' || !d.titulo.trim() || d.titulo.length > 80) e.titulo = ['errTitulo'];
  if (typeof d.activa !== 'boolean') e.activa = ['errValidacion'];
  if ((d.desde && !FECHA.test(d.desde)) || (d.hasta && !FECHA.test(d.hasta))) e.desde = ['errFechas'];
  else if (d.desde && d.hasta && d.desde > d.hasta) e.hasta = ['errFechasPosterior'];
  const n = d.niveles;
  if (!Array.isArray(n) || n.length !== DISTANCIAS.length || n.some((x, i) => Number(x?.distancia) !== DISTANCIAS[i])) {
    e.niveles = ['errNivelesOrden'];
  } else if (n.some((x) => typeof x.texto !== 'string' || !x.texto.trim() || x.texto.length > 140 || !Number.isInteger(x.descuentoPct) || x.descuentoPct < 0 || x.descuentoPct > 100)) {
    e.niveles = ['errNivelesCampos'];
  } else if (!nivelesMejoran(n)) {
    e.niveles = ['errNivelesMejora'];
  }
  return Object.keys(e).length ? e : null;
}

/** Payload limpio para POST (con restauranteId) o PUT (sin él). */
export function paraGuardar(d, restauranteId) {
  return {
    ...(restauranteId ? { restauranteId: String(restauranteId) } : {}),
    titulo: d.titulo.trim(),
    activa: Boolean(d.activa),
    desde: d.desde || null,
    hasta: d.hasta || null,
    niveles: DISTANCIAS.map((distancia, i) => ({
      distancia,
      texto: String(d.niveles[i]?.texto ?? '').trim(),
      descuentoPct: Number(d.niveles[i]?.descuentoPct) || 0,
    })),
  };
}

/** Fecha de hoy (AAAA-MM-DD) en la zona horaria de Madrid, la misma que usa el backend. */
export function hoyMadrid(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(ahora);
}

/** 'activa' | 'fueraVigencia' | 'inactiva' para el distintivo de la lista. */
export function estadoOferta(o, hoy = hoyMadrid()) {
  if (!o?.activa) return 'inactiva';
  if ((o.desde && o.desde > hoy) || (o.hasta && o.hasta < hoy)) return 'fueraVigencia';
  return 'activa';
}

/** Detalles de campo de un 400 del backend → claves i18n relativas a ofertas. */
export function erroresDeApi(err) {
  const detalles = err?.data?.details;
  if (!detalles || typeof detalles !== 'object') return null;
  const mapa = { titulo: 'errTitulo', niveles: 'errNiveles', desde: 'errFechas', hasta: 'errFechas' };
  const salida = {};
  for (const campo of Object.keys(detalles)) salida[campo] = [mapa[campo] || 'errValidacion'];
  return salida;
}

/** Error de la API → clave i18n (relativa a ofertas.) para el mensaje general. */
export function claveErrorApi(err) {
  if (!err?.status) return 'errRed';
  if (err.status === 409) return 'errActivaExistente';
  if (err.status === 401 || err.status === 403) return 'errPermiso';
  if (err.status === 404) return 'errNoEncontrada';
  if (err.status === 400) return /nivel/i.test(String(err.message || '')) ? 'errNiveles' : 'errValidacion';
  return 'errRed';
}
