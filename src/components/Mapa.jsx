/**
 * View pura: #/mapa — locales con coordenadas, filtrables por zona.
 * Leaflet + OpenStreetMap (gratis, sin claves). Usa lo ya cargado y solo
 * trae el conjunto entero la primera vez que hace falta (1 vez por visita).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRestaurants } from '../services/restaurantApi.js';
import { ZONAS_CATALUNA } from '../models/restaurantModel.js';

const CENTRO_CAT = [41.6, 1.8];

function nombreZona(z) {
  return String(z || '').replace(', Spain', '') || 'Sin zona';
}

export default function Mapa({ todos, total, onVerDetalle }) {
  const refCont = useRef(null);
  const refMapa = useRef(null);
  const refCapa = useRef(null);
  const [fuente, setFuente] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [zona, setZona] = useState('');
  const intentoHecho = useRef(false);

  // Datos: el mapa necesita TODO el conjunto para contar por zona.
  // Ignora la paginación del buscador y trae la colección completa 1 vez.
  useEffect(() => {
    let vivo = true;
    fetchRestaurants()
      .then((l) => {
        if (!vivo) return;
        setFuente(l);
        setCargando(false);
      })
      .catch((e) => {
        if (!vivo) return;
        // Fallback a lo paginado si falla por cuota
        if (todos.length > 0) {
          setFuente(todos);
          setCargando(false);
        } else {
          setError(e.message);
          setCargando(false);
        }
      });
    return () => {
      vivo = false;
    };
  }, []);

  const porZona = useMemo(() => {
    const m = {};
    fuente.forEach((r) => {
      const z = r.zona || 'Sin zona';
      m[z] = (m[z] || 0) + 1;
    });
    return m;
  }, [fuente]);

  const visibles = useMemo(
    () => fuente.filter((r) => r.coords && (!zona || (r.zona || 'Sin zona') === zona)),
    [fuente, zona],
  );

  // Crear el mapa una sola vez.
  useEffect(() => {
    if (!refCont.current || refMapa.current) return undefined;
    const mapa = L.map(refCont.current).setView(CENTRO_CAT, 8);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);
    refMapa.current = mapa;
    refCapa.current = L.layerGroup().addTo(mapa);
    // Fix contenedor con altura 0 al montar en pestaña oculta
    setTimeout(() => mapa.invalidateSize(), 200);
    return () => {
      mapa.remove();
      refMapa.current = null;
      refCapa.current = null;
    };
  }, []);

  // Repintar marcadores al cambiar zona/datos + clic en popup.
  useEffect(() => {
    const mapa = refMapa.current;
    const capa = refCapa.current;
    if (!mapa || !capa) return undefined;
    capa.clearLayers();
    const puntos = [];
    visibles.forEach((r) => {
      const mk = L.circleMarker([r.coords.lat, r.coords.lng], {
        radius: 7,
        color: '#00664f',
        weight: 2,
        fillColor: '#2fa37c',
        fillOpacity: 0.85,
      });
      mk.bindPopup(
        `<strong>${r.nombre.replace(/</g, '&lt;')}</strong><br>` +
          `★ ${r.valoracion ?? '—'} · ${r.precio} · ${nombreZona(r.zona)}<br>` +
          `<button data-ver-detalle="${r.id}" style="margin-top:0.4rem">Ver detalle</button>`,
      );
      mk.addTo(capa);
      puntos.push([r.coords.lat, r.coords.lng]);
    });
    if (puntos.length) mapa.fitBounds(puntos, { padding: [30, 30], maxZoom: 13 });
    else mapa.setView(CENTRO_CAT, 8);
    setTimeout(() => mapa.invalidateSize(), 100);
    function alAbrirPopup(e) {
      const btn = e.popup?.getElement()?.querySelector('[data-ver-detalle]');
      if (btn) {
        btn.onclick = () => {
          const hallado = visibles.find((x) => String(x.id) === btn.dataset.verDetalle);
          if (hallado) onVerDetalle(hallado);
        };
      }
    }
    mapa.on('popupopen', alAbrirPopup);
    return () => {
      mapa.off('popupopen', alAbrirPopup);
    };
  }, [visibles, onVerDetalle]);

  const zonas = useMemo(
    () => [...new Set([...ZONAS_CATALUNA, ...Object.keys(porZona)])],
    [porZona],
  );

  return (
    <section className="auth-pagina pagina-ancha" aria-labelledby="mapa-titulo">
      <div className="auth-tarjeta tarjeta-ancha">
        <h1 id="mapa-titulo">Mapa por zonas</h1>
        {cargando && <p>Cargando locales…</p>}
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {!cargando && !error && (
          <>
            <div className="tabs" role="group" aria-label="Filtrar por zona">
              <button
                type="button"
                aria-pressed={zona === ''}
                className={zona === '' ? 'btn-cta btn-peq' : 'btn-secundario btn-peq'}
                onClick={() => setZona('')}
              >
                Todas ({fuente.length})
              </button>
              {zonas.map((z) => (
                <button
                  key={z}
                  type="button"
                  aria-pressed={zona === z}
                  className={zona === z ? 'btn-cta btn-peq' : 'btn-secundario btn-peq'}
                  onClick={() => setZona(z)}
                >
                  {nombreZona(z)} ({porZona[z] ?? 0})
                </button>
              ))}
            </div>
            <p className="vacio-texto" aria-live="polite">
              {visibles.length} locales en el mapa{zona ? ` · ${nombreZona(zona)}` : ''}.
            </p>
            <div ref={refCont} className="mapa-grande" role="application" aria-label="Mapa de restaurantes" />
          </>
        )}
      </div>
    </section>
  );
}
