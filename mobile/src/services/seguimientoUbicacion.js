/**
 * Arranque del seguimiento de ubicación en la app (G03), sin React para poder
 * probarlo con node --test. `Location` es expo-location (inyectado).
 * Cada espera (permiso, servicios, suscripción) vuelve a comprobar sigueActiva():
 * si el usuario desactivó mientras tanto, no arranca nada y los avisos tardíos se
 * ignoran. Devuelve la función que para el seguimiento.
 *
 * C02: el permiso del sistema solo se PIDE si `pedir` es true (viene de un toque
 * del usuario: Aceptar o Activar). Al abrir la app solo se CONSULTA, para no
 * volver a preguntar en cada arranque. Errores de permiso:
 *  - 'permisoPendiente': no concedido y el sistema aún deja preguntar (botón «Dar permiso»).
 *  - 'permisoBloqueado': el sistema ya no deja preguntar (botón «Abrir ajustes»).
 */
export function iniciarSeguimiento(Location, { sigueActiva, onPosicion, onError, pedir = false, onConcedido }) {
  let parado = false;
  let suscripcion = null;
  const activo = () => !parado && sigueActiva();

  (async () => {
    try {
      const permiso = pedir
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      if (!activo()) return;
      if (permiso.status !== 'granted') {
        onError(permiso.canAskAgain === false ? 'permisoBloqueado' : 'permisoPendiente');
        return;
      }
      if (pedir) onConcedido?.();
      const servicios = await Location.hasServicesEnabledAsync();
      if (!activo()) return;
      if (!servicios) { onError('errorNoDisponible'); return; }
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (l) => { if (activo()) onPosicion(l.coords); },
        () => { if (activo()) onError('errorNoDisponible'); },
      );
      // Llegó tarde: el usuario ya desactivó mientras se creaba la suscripción.
      if (activo()) suscripcion = sub; else sub.remove();
    } catch {
      if (activo()) onError('errorDesconocido');
    }
  })();

  return () => { parado = true; suscripcion?.remove(); suscripcion = null; };
}
