/**
 * Fotos de una sala JAM con el directo sin fotos: guarda las últimas que han
 * llegado y, cuando el directo trae una versión (fotosV) más nueva, pide la sala
 * completa UNA vez aunque lleguen más eventos mientras la petición está en curso.
 * Las respuestas con una versión más antigua no pisan las fotos ya mostradas.
 * @param {(codigo: string) => Promise<object>} pedirSala
 */
export function crearSincronizadorFotos(pedirSala) {
  let fotos = { portada: null, foto: null, v: null };
  let enCurso = false;
  return {
    /** Devuelve la sala con las fotos vigentes; alRefrescar recibe la sala completa pedida. */
    aplicar(nueva, alRefrescar) {
      const v = nueva.fotosV || 0;
      if ('portada' in nueva) {
        if (fotos.v === null || v >= fotos.v) fotos = { portada: nueva.portada, foto: nueva.foto, v };
      } else if (fotos.v !== null && v > fotos.v && !enCurso) {
        enCurso = true;
        pedirSala(nueva.codigo)
          .then((completa) => { enCurso = false; alRefrescar(completa); })
          .catch(() => { enCurso = false; });
      }
      return { ...nueva, portada: fotos.portada, foto: fotos.foto };
    },
  };
}
