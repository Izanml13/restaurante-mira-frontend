/** Avisos de ofertas: throttle, consulta periódica y deduplicación por visita/día. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import useUbicacion from './useUbicacion.js';
import { debeConsultar, ofertaEnZona, soloAvisables, leerFavoritosAvisos, INTERVALO_MS } from '../models/avisosOfertasModel.js';
import { ofertasCerca, registrarAviso } from '../services/ofertasCercaApi.js';
import { notificarLocal } from '../services/notificaciones.js';
import { seleccionarAvisos } from '../services/sesionesAvisos.js';
import { alVolverAPrimerPlano } from '../services/primerPlano.js';

export default function useAvisosOfertas(t) {
  const { activa, posicion } = useUbicacion();
  const [avisos, setAvisos] = useState([]);
  const [enZona, setEnZona] = useState(null);
  const ultima = useRef(null);
  const enCurso = useRef(false);
  const tRef = useRef(t);
  const posRef = useRef(posicion);
  const consultarRef = useRef(null);
  useEffect(() => { tRef.current = t; }, [t]);
  useEffect(() => { posRef.current = posicion; consultarRef.current?.(); }, [posicion]);

  useEffect(() => {
    if (!activa) { setAvisos([]); setEnZona(null); ultima.current = null; return undefined; }
    let vigente = true;
    const consultar = async () => {
      const p = posRef.current;
      if (!vigente || AppState.currentState !== 'active' || !p || enCurso.current || !debeConsultar(ultima.current, p)) return;
      enCurso.current = true;
      ultima.current = { ...p, t: Date.now() };
      try {
        const resultados = await ofertasCerca(p);
        if (!vigente || AppState.currentState !== 'active') return;
        setEnZona(ofertaEnZona(resultados));
        const candidatos = soloAvisables(resultados, leerFavoritosAvisos(globalThis.localStorage));
        const nuevos = await seleccionarAvisos(candidatos, 3, () => vigente && AppState.currentState === 'active');
        if (!vigente || !nuevos.length) return;
        const ids = new Set(nuevos.map(n => String(n.restaurante.id)));
        setAvisos(a => [...nuevos, ...a.filter(x => !ids.has(String(x.restaurante.id)))].slice(0, 3));
        for (const n of nuevos) {
          registrarAviso(n.oferta.id, n.nivel.distancia).catch(() => {});
          const llegada = n.nivel.distancia === 20;
          notificarLocal({
            titulo: `${llegada ? '📍' : '🎯'} ${n.restaurante.nombre}`,
            cuerpo: `${n.nivel.texto} · ${llegada ? tRef.current('ofertasCerca.llegada') : tRef.current('ofertasCerca.aDistancia', { m: n.distanciaM })}`,
            data: { restauranteId: String(n.restaurante.id), llegada: llegada ? '1' : '' },
          });
        }
      } catch { /* red o 429: se reintenta en la siguiente consulta */ }
      finally { enCurso.current = false; }
    };
    consultarRef.current = consultar;
    consultar();
    const reloj = setInterval(consultar, INTERVALO_MS);
    const baja = alVolverAPrimerPlano(AppState, consultar);
    return () => { vigente = false; consultarRef.current = null; clearInterval(reloj); baja(); };
  }, [activa]);

  const descartar = useCallback(aviso => setAvisos(a => a.filter(x => x !== aviso)), []);
  return { avisos, descartar, enZona };
}
