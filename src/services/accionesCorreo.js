/** Acciones de los enlaces de Firebase Auth. Sin mode conserva el reset antiguo. */
export function accionSegunMode(mode) {
  if (mode == null || mode === '') return 'resetPassword';
  return ['verifyEmail', 'resetPassword', 'recoverEmail'].includes(mode) ? mode : 'desconocida';
}

/** Firebase puede poner los parámetros antes del hash o dentro de él. */
export function leerAccionCorreo({ search = '', hash = '' } = {}) {
  const enHash = new URLSearchParams(hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '');
  const enSearch = new URLSearchParams(search.replace(/^\?/, ''));
  const principal = enHash.get('oobCode') ? enHash : enSearch;
  const otro = principal === enHash ? enSearch : enHash;
  return {
    accion: accionSegunMode(principal.get('mode') ?? otro.get('mode')),
    oobCode: principal.get('oobCode') || '',
  };
}
