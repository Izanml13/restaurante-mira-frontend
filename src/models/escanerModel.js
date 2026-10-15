/**
 * Lógica pura del escáner de QR de llegada (G10, fase 3).
 * Sin dependencias de navegador: el componente llama a esto desde la cámara
 * o desde el campo manual.
 *
 * El contrato real (POST /v1/ofertas/visitas/validar) aún no está publicado;
 * hasta entonces se usa `resultadoMock`, documentado en
 * docs/coordenacion/CONTRATOS-ASUMIDOS.md.
 */

/** Estados posibles de una validación (claves i18n: escaner.estado<Estado>). */
export const ESTADOS = {
  OK: 'ok',
  CADUCADO: 'caducado',
  YA_USADO: 'ya_usado',
  OTRO_RESTAURANTE: 'otro_restaurante',
  INVALIDO: 'invalido',
  ERROR_RED: 'error_red',
};

const MAX_LARGO_CODIGO = 1024;
// Forma esperada del QR: MIRA.<payload base64url>.<firma>
const RE_CODIGO = /^MIRA\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/**
 * Sanea lo leído del QR o pegado a mano. Devuelve el código recortado o
 * null si está vacío, es demasiado largo o tiene caracteres no imprimibles.
 */
export function normalizarCodigo(entrada) {
  if (typeof entrada !== 'string') return null;
  const texto = entrada.trim();
  if (!texto || texto.length > MAX_LARGO_CODIGO) return null;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(texto)) return null;
  return texto;
}

/** Forma del código (acepta el texto completo leído del QR). */
export function esCodigoFormaValida(codigo) {
  return typeof codigo === 'string' && RE_CODIGO.test(codigo);
}

/**
 * Estado a mostrar a partir de la respuesta HTTP del futuro endpoint de
 * validación (o de cualquier error con `status`).
 */
export function estadoDesdeError(err) {
  if (!err || !Number.isFinite(err.status)) return ESTADOS.ERROR_RED;
  switch (err.status) {
    case 400:
    case 404:
      return ESTADOS.INVALIDO;
    case 403:
      return ESTADOS.OTRO_RESTAURANTE;
    case 409:
      return ESTADOS.YA_USADO;
    case 410:
      return ESTADOS.CADUCADO;
    default:
      return ESTADOS.ERROR_RED;
  }
}

/**
 * Mock local de validación (mientras no exista el endpoint de fase 3).
 * Determinista según el contenido, para poder probar todos los estados:
 *   ...caducado → caducado | ...usado → ya_usado | ...otro → otro_restaurante
 *   sin forma válida → invalido | resto → ok (oferta de llegada, 20 m)
 * Devuelve una promesa como la API real.
 */
export function resultadoMock(codigo) {
  const limpio = normalizarCodigo(codigo);
  const demora = 400;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (limpio == null) {
        const e = new Error('Código no válido');
        e.status = 400;
        reject(e);
        return;
      }
      if (!esCodigoFormaValida(limpio)) {
        const e = new Error('Código no válido');
        e.status = /caducado/i.test(limpio) ? 410
          : /usado/i.test(limpio) ? 409
          : /otro/i.test(limpio) ? 403
          : 400;
        reject(e);
        return;
      }
      resolve({
        estado: ESTADOS.OK,
        visitaId: `vis_${hashCodigo(limpio)}`,
        oferta: {
          titulo: 'Menú de mediodía',
          nivel: { distancia: 20, texto: '20 % + postre gratis', descuentoPct: 20 },
        },
      });
    }, demora);
  });
}

/** Hash corto y estable del código para el mock (no es criptográfico). */
function hashCodigo(texto) {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** Clave i18n del mensaje de cada estado (`escaner.estadoOk`, ...). */
export function claveMensajeEstado(estado) {
  const mapa = {
    [ESTADOS.OK]: 'escaner.estadoOk',
    [ESTADOS.CADUCADO]: 'escaner.estadoCaducado',
    [ESTADOS.YA_USADO]: 'escaner.estadoYaUsado',
    [ESTADOS.OTRO_RESTAURANTE]: 'escaner.estadoOtroRestaurante',
    [ESTADOS.INVALIDO]: 'escaner.estadoInvalido',
    [ESTADOS.ERROR_RED]: 'escaner.estadoErrorRed',
  };
  return mapa[estado] || 'escaner.estadoInvalido';
}

/**
 * Añade una visita validada a la lista de llegadas del día, sin duplicar
 * `visitaId` y dejando la más reciente arriba.
 */
export function agregarLlegada(lista, visita) {
  if (!visita || !visita.visitaId) return lista;
  const sinDuplicado = (Array.isArray(lista) ? lista : [])
    .filter((v) => v.visitaId !== visita.visitaId);
  const nueva = { hora: new Date().toISOString(), ...visita };
  return [nueva, ...sinDuplicado];
}
