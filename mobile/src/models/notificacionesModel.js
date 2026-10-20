/**
 * Model — estado de las notificaciones en Mi cuenta (C02, revisiones de Codex):
 * junta el consentimiento guardado y el permiso real del sistema del móvil.
 *  - 'activas':      aceptado y permiso concedido → botón «Desactivar».
 *  - 'bloqueado':    el sistema ya no deja preguntar (aunque la decisión fuera
 *                    «rechazado», p. ej. tras denegar el diálogo) → «Abrir ajustes».
 *  - 'faltaPermiso': aceptado (p. ej. traído del perfil a un móvil nuevo) pero sin
 *                    permiso y el sistema aún deja preguntar → «Dar permiso».
 *  - 'desactivadas': sin decidir o rechazado, y se puede preguntar → «Activar».
 */
export function estadoNotificaciones(consentimiento, permiso) {
  const aceptado = consentimiento?.estado === 'aceptado';
  if (permiso?.status === 'granted') return aceptado ? 'activas' : 'desactivadas';
  if (permiso?.canAskAgain === false) return 'bloqueado';
  return aceptado ? 'faltaPermiso' : 'desactivadas';
}

/**
 * Al reconsultar (p. ej. al volver de Ajustes): hay que registrar el dispositivo
 * si las notificaciones están aceptadas y el permiso acaba de pasar a concedido.
 * Así no basta con cambiar la etiqueta: se registra sin volver a pedir permiso.
 */
export function debeRegistrarAlRecuperar(permisoAntes, permisoAhora, consentimiento) {
  return consentimiento?.estado === 'aceptado'
    && permisoAhora?.status === 'granted'
    && Boolean(permisoAntes) && permisoAntes.status !== 'granted';
}
