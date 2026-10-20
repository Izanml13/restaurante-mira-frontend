/**
 * Hook — avisos por distancia en la web (G06). Usa la ubicación de G03 (solo con
 * consentimiento y la página abierta), consulta /v1/ofertas/cerca con throttle
 * (30 s o 50 m) y devuelve los avisos nuevos (uno por nivel y restaurante).
 * Cada aviso mostrado se cuenta con POST /v1/ofertas/:id/avisos.
 * Si el usuario ya dio permiso de notificaciones (T07), el aviso sale también
 * como notificación del sistema (útil en iPhone con la PWA en pantalla).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import useUbicacion from './useUbicacion.js';
import { debeConsultar, filtrarNuevos, leerVistos, guardarVistos, soloAvisables, leerFavoritosAvisos } from '../models/avisosOfertasModel.js';
import { ofertasCerca, registrarAviso } from '../services/ofertasCercaApi.js';

function almacenamiento() {
  try { return window.localStorage; } catch { return null; }
}

// Notificación del sistema vía service worker; si no hay permiso, solo queda el aviso en página.
function notificarSistema({ restaurante, nivel }) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    navigator.serviceWorker?.ready
      .then((reg) => reg.showNotification(restaurante.nombre || 'MIRA', {
        body: nivel.texto || '',
        tag: `oferta:${restaurante.id}`,
        data: { ruta: `r/${restaurante.id}` },
      }))
      .catch(() => {});
  } catch { /* navegador sin soporte */ }
}

export default function useAvisosOfertas() {
  const { activa, posicion } = useUbicacion();
  const [avisos, setAvisos] = useState([]);
  const ultima = useRef(null);
  const enCurso = useRef(false);

  useEffect(() => {
    if (!activa || !posicion || enCurso.current) return;
    if (!debeConsultar(ultima.current, posicion)) return;
    ultima.current = { lat: posicion.lat, lng: posicion.lng, t: Date.now() };
    enCurso.current = true;
    ofertasCerca(posicion)
      .then((resultados) => {
        const avisables = soloAvisables(resultados, leerFavoritosAvisos(almacenamiento()));
        // Solo se marcan y cuentan los que caben en pantalla (máximo 3, revisión R01).
        const { nuevos, vistos } = filtrarNuevos(avisables, leerVistos(almacenamiento()), 3);
        if (!nuevos.length) return;
        guardarVistos(almacenamiento(), vistos);
        // El nivel nuevo sustituye al anterior del mismo restaurante.
        const ids = new Set(nuevos.map((n) => String(n.restaurante.id)));
        setAvisos((a) => [...nuevos, ...a.filter((x) => !ids.has(String(x.restaurante.id)))].slice(0, 3));
        for (const n of nuevos) {
          registrarAviso(n.oferta.id, n.nivel.distancia).catch(() => {});
          notificarSistema(n);
        }
      })
      .catch(() => { /* sin red o 429: se reintenta en la siguiente consulta */ })
      .finally(() => { enCurso.current = false; });
  }, [activa, posicion]);

  // Al desactivar la ubicación desaparecen los avisos y se olvida la última consulta.
  useEffect(() => {
    if (!activa) { setAvisos([]); ultima.current = null; }
  }, [activa]);

  const descartar = useCallback((aviso) => setAvisos((a) => a.filter((x) => x !== aviso)), []);

  return { avisos, descartar };
}
