/**
 * Lógica pura del escáner de QR de llegada (G10, fase 3).
 * Sin dependencias de navegador: el componente llama a esto desde la cámara
 * o desde el campo manual.
 *
 * Contrato oficial (Contratos API.md, fase 3):
 *   POST /v1/visitas/validar { qr } → { visita, aplicar, cliente }
 *   GET  /v1/visitas/restaurante?restauranteId=&fecha= → { data: [Visita + cliente] }
 * El QR es `v1.<visitaId>.<caducaEnMs>.<firma>`; la firma y la caducidad las
 * valida el servidor, no el panel.
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

/**
 * Sanea lo leído del QR o pegado a mano. Devuelve el código recortado o
 * null si está vacío, es demasiado largo o tiene caracteres no imprimibles.
 * La forma y la firma las comprueba el servidor (POST /v1/visitas/validar).
 */
export function normalizarCodigo(entrada) {
  if (typeof entrada !== 'string') return null;
  const texto = entrada.trim();
  if (!texto || texto.length > MAX_LARGO_CODIGO) return null;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(texto)) return null;
  return texto;
}

/**
 * Estado a mostrar a partir de la respuesta HTTP de POST /v1/visitas/validar.
 * Códigos reales: 400 QR_INVALIDO, 403 OTRO_RESTAURANTE, 404 (visita inexistente),
 * 409 QR_USADO, 410 QR_CADUCADO.
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
 * De la fila de la lista de llegadas (Visita + cliente) o de la respuesta
 * de validar, extrae lo que pinta el panel. Devuelve null si no hay id.
 */
export function aLlegada(visita) {
  const id = visita?.id || visita?.visita?.id;
  if (!id) return null;
  const nivel = visita?.nivel || visita?.visita?.nivel || visita?.aplicar;
  return {
    id,
    hora: visita?.confirmadaEn || visita?.creada || visita?.visita?.confirmadaEn || visita?.visita?.creada || new Date().toISOString(),
    estado: visita?.estado || visita?.visita?.estado || null,
    cliente: visita?.cliente?.nombre || null,
    texto: nivel?.texto || null,
    descuentoPct: Number.isFinite(Number(nivel?.descuentoPct)) ? Number(nivel.descuentoPct) : null,
  };
}

/**
 * Añade una llegada a la lista del día, sin repetir id y dejando la más
 * reciente arriba.
 */
export function agregarLlegada(lista, llegada) {
  if (!llegada?.id) return lista;
  const sinDuplicado = (Array.isArray(lista) ? lista : [])
    .filter((v) => v.id !== llegada.id);
  return [llegada, ...sinDuplicado];
}
