/**
 * Hook — ubicación en la app (G03), solo en primer plano: expo-location deja de
 * enviar posiciones cuando la app pasa a segundo plano (eso llegará con G06).
 * La posición vive en memoria y no se envía ni se guarda.
 */
import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { leerConsentimiento, guardarConsentimiento, posicionVisible } from '../models/ubicacionModel.js';

export default function useUbicacion() {
  const [consentimiento, setConsentimiento] = useState(() => leerConsentimiento(globalThis.localStorage));
  const [posicion, setPosicion] = useState(null);
  const [error, setError] = useState('');
  const activa = consentimiento.estado === 'aceptado';

  useEffect(() => {
    if (!activa) { setPosicion(null); setError(''); return undefined; }
    let vivo = true;
    let suscripcion = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!vivo) return;
        if (status !== 'granted') { setError('errorPermiso'); return; }
        if (!(await Location.hasServicesEnabledAsync())) { if (vivo) setError('errorNoDisponible'); return; }
        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10 },
          (l) => { setPosicion(posicionVisible(l.coords)); setError(''); },
          () => setError('errorNoDisponible'),
        );
        // Si el usuario desactivó mientras se pedía el permiso, cerrar al momento.
        if (vivo) suscripcion = sub; else sub.remove();
      } catch {
        if (vivo) setError('errorDesconocido');
      }
    })();
    return () => { vivo = false; suscripcion?.remove(); };
  }, [activa]);

  const decidir = useCallback((estado) => setConsentimiento(guardarConsentimiento(globalThis.localStorage, estado)), []);

  return {
    consentimiento,
    activa,
    posicion,
    error,
    aceptar: useCallback(() => decidir('aceptado'), [decidir]),
    rechazar: useCallback(() => decidir('rechazado'), [decidir]),
  };
}
