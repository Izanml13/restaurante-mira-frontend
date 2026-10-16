/**
 * Model — estado de las notificaciones en Mi cuenta (C02, revisión de Codex):
 * junta el consentimiento guardado y el permiso real del sistema del móvil.
 *  - 'desactivadas': sin decidir o rechazado → botón «Activar» (pide permiso).
 *  - 'activas':      aceptado y permiso concedido → botón «Desactivar».
 *  - 'faltaPermiso': aceptado (p. ej. traído del perfil a un móvil nuevo) pero
 *                    sin permiso y el sistema aún deja preguntar → «Dar permiso».
 *  - 'bloqueado':    aceptado pero el sistema ya no deja preguntar → «Abrir ajustes».
 */
export function estadoNotificaciones(consentimiento, permiso) {
  if (consentimiento?.estado !== 'aceptado') return 'desactivadas';
  if (permiso?.status === 'granted') return 'activas';
  if (permiso?.canAskAgain === false) return 'bloqueado';
  return 'faltaPermiso';
}
