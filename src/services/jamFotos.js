/**
 * Fotos de una sala JAM con el directo sin fotos: guarda las últimas que han
 * llegado y, cuando el directo trae una versión (fotosV) más nueva, pide la sala
 * completa. Solo hay una petición en curso; se recuerda la mayor versión vista y,
 * al terminar, se vuelve a pedir solo si las fotos cargadas siguen por detrás.
 * Las respuestas con una versión más antigua no pisan las fotos ya mostradas.
 * Un error no reintenta: espera al siguiente evento.
 * @param {(codigo: string) => Promise<object>} pedirSala
 */
export function crearSincronizadorFotos(pedirSala) {
  let fotos = { portada: null, foto: null, v: null };
  let vista = 0;
  let enCurso = false;

  function revisar(codigo, alRefrescar) {
    if (enCurso || fotos.v === null || vista <= fotos.v) return;
    enCurso = true;
    pedirSala(codigo)
      .then((completa) => { enCurso = false; alRefrescar(completa); })
      .catch(() => { enCurso = false; });
  }

  return {
    /** Devuelve la sala con las fotos vigentes; alRefrescar recibe la sala completa pedida. */
    aplicar(nueva, alRefrescar) {
      const v = nueva.fotosV || 0;
      vista = Math.max(vista, v);
      if ('portada' in nueva && (fotos.v === null || v >= fotos.v)) fotos = { portada: nueva.portada, foto: nueva.foto, v };
      revisar(nueva.codigo, alRefrescar);
      return { ...nueva, portada: fotos.portada, foto: fotos.foto };
    },
  };
}
