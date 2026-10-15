/**
 * Hook — avisos por distancia en la web (G06). Usa la ubicación de G03 (solo con
 * consentimiento y la página abierta), consulta /v1/ofertas/cerca con throttle
 * (30 s o 50 m) y devuelve los avisos nuevos (uno por nivel y restaurante).
 * Cada aviso mostrado se cuenta con POST /v1/ofertas/:id/avisos.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import useUbicacion from './useUbicacion.js';
import { debeConsultar, filtrarNuevos, leerVistos, guardarVistos } from '../models/avisosOfertasModel.js';
import { ofertasCerca, registrarAviso } from '../services/ofertasCercaApi.js';

function almacenamiento() {
  try { return window.localStorage; } catch { return null; }
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
        const { nuevos, vistos } = filtrarNuevos(resultados, leerVistos(almacenamiento()));
        if (!nuevos.length) return;
        guardarVistos(almacenamiento(), vistos);
        // El nivel nuevo sustituye al anterior del mismo restaurante.
        const ids = new Set(nuevos.map((n) => String(n.restaurante.id)));
        setAvisos((a) => [...nuevos, ...a.filter((x) => !ids.has(String(x.restaurante.id)))].slice(0, 3));
        for (const n of nuevos) registrarAviso(n.oferta.id, n.nivel.distancia).catch(() => {});
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
