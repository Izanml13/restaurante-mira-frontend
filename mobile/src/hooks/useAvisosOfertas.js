/**
 * Hook — avisos por distancia en la app (G06), en primer plano. Igual que en la
 * web: ubicación de G03, /v1/ofertas/cerca con throttle (30 s o 50 m), un aviso
 * por nivel y restaurante y POST /v1/ofertas/:id/avisos por cada aviso mostrado.
 * Además lanza una notificación local (al tocarla se abre la ficha).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import useUbicacion from './useUbicacion.js';
import { debeConsultar, filtrarNuevos, leerVistos, guardarVistos, soloAvisables, leerFavoritosAvisos } from '../models/avisosOfertasModel.js';
import { ofertasCerca, registrarAviso } from '../services/ofertasCercaApi.js';
import { notificarLocal } from '../services/notificaciones.js';

export default function useAvisosOfertas(t) {
  const { activa, posicion } = useUbicacion();
  const [avisos, setAvisos] = useState([]);
  const ultima = useRef(null);
  const enCurso = useRef(false);
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  useEffect(() => {
    if (!activa || !posicion || enCurso.current) return;
    if (!debeConsultar(ultima.current, posicion)) return;
    ultima.current = { lat: posicion.lat, lng: posicion.lng, t: Date.now() };
    enCurso.current = true;
    ofertasCerca(posicion)
      .then((resultados) => {
        const storage = globalThis.localStorage;
        const { nuevos, vistos } = filtrarNuevos(soloAvisables(resultados, leerFavoritosAvisos(storage)), leerVistos(storage));
        if (!nuevos.length) return;
        guardarVistos(storage, vistos);
        const ids = new Set(nuevos.map((n) => String(n.restaurante.id)));
        setAvisos((a) => [...nuevos, ...a.filter((x) => !ids.has(String(x.restaurante.id)))].slice(0, 3));
        for (const n of nuevos) {
          registrarAviso(n.oferta.id, n.nivel.distancia).catch(() => {});
          const llegada = n.nivel.distancia === 20;
          notificarLocal({
            titulo: `${llegada ? '📍' : '🎯'} ${n.restaurante.nombre}`,
            cuerpo: `${n.nivel.texto} · ${llegada ? tRef.current('ofertasCerca.llegada') : tRef.current('ofertasCerca.aDistancia', { m: n.distanciaM })}`,
            data: { restauranteId: String(n.restaurante.id), llegada: llegada ? '1' : '' },
          });
        }
      })
      .catch(() => { /* sin red o 429: se reintenta en la siguiente consulta */ })
      .finally(() => { enCurso.current = false; });
  }, [activa, posicion]);

  useEffect(() => {
    if (!activa) { setAvisos([]); ultima.current = null; }
  }, [activa]);

  const descartar = useCallback((aviso) => setAvisos((a) => a.filter((x) => x !== aviso)), []);

  return { avisos, descartar };
}
