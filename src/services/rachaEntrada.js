/**
 * Al entrar con sesión: abre la racha si la de hoy sigue sin reclamar.
 * No la abre si la API falla ni si la sesión cambió mientras se consultaba
 * (sigueVigente() devuelve false tras cerrar o cambiar de cuenta).
 * @returns {Promise<boolean>} true si se abrió
 */
export async function abrirRachaSiPendiente(consultar, abrir, sigueVigente) {
  const datos = await consultar();
  if (!sigueVigente() || !datos || datos.error || datos.yaReclamado) return false;
  abrir(datos);
  return true;
}
