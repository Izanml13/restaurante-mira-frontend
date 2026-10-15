/**
 * Hook — pantalla de llegada (G09). Pide la visita con la posición actual
 * (≤ 50 m), guarda el QR y consulta GET /v1/visitas/:id cada pocos segundos
 * hasta «confirmada» o «caducada». La posición no se guarda en ningún sitio.
 *
 * fase: 'esperandoUbicacion' | 'creando' | 'qr' | 'lejos' | 'sinSesion' |
 *       'sinOferta' | 'noDisponible' | 'error'
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { crearVisita, verVisita } from '../services/visitasApi.js';
import { estadoVisible, SONDEO_MS } from '../models/llegadaModel.js';

function faseDeError(e) {
  if (e?.status === 422) return 'lejos';
  if (e?.status === 401) return 'sinSesion';
  if (e?.status === 404) return 'sinOferta';
  if (e?.status === 503) return 'noDisponible';
  return 'error';
}

export default function useLlegada(restauranteId, posicion) {
  const [fase, setFase] = useState('esperandoUbicacion');
  const [visita, setVisita] = useState(null);
  const [qr, setQr] = useState('');
  const [distanciaM, setDistanciaM] = useState(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const pedidaAuto = useRef(false);
  const posRef = useRef(posicion);
  useEffect(() => { posRef.current = posicion; }, [posicion]);

  const pedir = useCallback(async () => {
    const p = posRef.current;
    if (!restauranteId || !p) { setFase('esperandoUbicacion'); return; }
    setFase('creando');
    try {
      const r = await crearVisita({ restauranteId, lat: p.lat, lng: p.lng });
      setVisita(r.visita);
      setQr(r.qr);
      setFase('qr');
    } catch (e) {
      setDistanciaM(Number.isFinite(e?.data?.distanciaM) ? e.data.distanciaM : null);
      setFase(faseDeError(e));
    }
  }, [restauranteId]);

  // La primera vez que hay posición, se pide sola.
  useEffect(() => {
    if (posicion && !pedidaAuto.current) { pedidaAuto.current = true; pedir(); }
  }, [posicion, pedir]);

  const estado = estadoVisible(visita, ahora);

  // Cuenta atrás (1 s) y sondeo de la API mientras esté pendiente.
  useEffect(() => {
    if (fase !== 'qr' || estado !== 'pendiente') return undefined;
    const reloj = setInterval(() => setAhora(Date.now()), 1000);
    const sondeo = setInterval(() => {
      verVisita(visita.id).then((v) => v && setVisita(v)).catch(() => { /* reintenta en el siguiente */ });
    }, SONDEO_MS);
    return () => { clearInterval(reloj); clearInterval(sondeo); };
  }, [fase, estado, visita?.id]);

  return { fase, visita, qr, estado, distanciaM, ahora, pedir };
}
