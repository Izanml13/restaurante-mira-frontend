/**
 * Hook — ubicación en la app (G03), solo en primer plano: expo-location deja de
 * enviar posiciones cuando la app pasa a segundo plano (eso llegará con G06).
 * La posición vive en memoria y no se envía ni se guarda.
 */
import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import * as Location from 'expo-location';
import { leerConsentimiento, posicionVisible } from '../models/ubicacionModel.js';
import { iniciarSeguimiento } from '../services/seguimientoUbicacion.js';
import { desactivarFondo } from '../services/ubicacionFondo.js';
import { decidirConsentimiento, suscribirConsentimientos } from '../services/consentimientosApi.js';

// Compartido entre instancias: el toque de «Aceptar» en una pantalla hace que la
// primera que arranque pida el permiso; al concederse, las demás vuelven a consultar.
let pedirPendiente = false;
const reintentos = new Set();

export default function useUbicacion() {
  const [consentimiento, setConsentimiento] = useState(() => leerConsentimiento(globalThis.localStorage));
  const [posicion, setPosicion] = useState(null);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const activa = consentimiento.estado === 'aceptado';

  // Todas las instancias del hook (Mi cuenta, avisos de G06…) comparten la decisión.
  useEffect(() => suscribirConsentimientos(() => setConsentimiento(leerConsentimiento(globalThis.localStorage))), []);
  useEffect(() => {
    const reintentar = () => setIntento((n) => n + 1);
    reintentos.add(reintentar);
    return () => { reintentos.delete(reintentar); };
  }, []);

  useEffect(() => {
    if (!activa) { setPosicion(null); setError(''); return undefined; }
    let vigente = true;
    // El permiso del sistema solo se PIDE tras un toque; al abrir la app solo se consulta.
    const pedir = pedirPendiente;
    pedirPendiente = false;
    const parar = iniciarSeguimiento(Location, {
      pedir,
      onConcedido: () => { for (const f of reintentos) f(); },
      sigueActiva: () => vigente,
      onPosicion: (coords) => { setPosicion(posicionVisible(coords)); setError(''); },
      onError: setError,
    });
    return () => { vigente = false; parar(); };
  }, [activa, intento]);

  const decidir = useCallback((estado) => {
    if (estado === 'aceptado') pedirPendiente = true;
    else desactivarFondo();
    decidirConsentimiento('ubicacion', estado);
    setConsentimiento(leerConsentimiento(globalThis.localStorage));
    setIntento((n) => n + 1);
  }, []);

  /** Volver a pedir el permiso del sistema (toque en «Dar permiso»). */
  const pedirPermiso = useCallback(() => { pedirPendiente = true; setIntento((n) => n + 1); }, []);

  return {
    consentimiento,
    activa,
    posicion,
    error,
    aceptar: useCallback(() => decidir('aceptado'), [decidir]),
    rechazar: useCallback(() => decidir('rechazado'), [decidir]),
    pedirPermiso,
    abrirAjustes: useCallback(() => Linking.openSettings().catch(() => {}), []),
  };
}
