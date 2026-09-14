/**
 * View pura: #/mapa — locales con coordenadas, filtrables por zona.
 * Leaflet + OpenStreetMap (gratis, sin claves).
 * Sin geolocalización: centra en el punto más céntrico de cada ciudad.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRestaurants } from '../services/restaurantApi.js';
import { ZONAS_CATALUNA } from '../models/restaurantModel.js';
import { centroDeZona, CENTRO_CATALUNA } from '../services/cityCenters.js';

function nombreZona(z) {
  return String(z || '').replace(', Spain', '') || 'Sin zona';
}

function escapar(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Icono centro ciudad (evita bug iconos default de Leaflet en Vite)
function iconoCentro() {
  return L.divIcon({
    className: 'mapa-centro-pin',
    html: '★',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function Mapa({ todos, total, onVerDetalle }) {
  const refCont = useRef(null);
  const refMapa = useRef(null);
  const refCapa = useRef(null);
  const refCapaCentro = useRef(null);
  const [fuente, setFuente] = useState(() => (Array.isArray(todos) && todos.length ? [...todos] : []));
  const [cargando, setCargando] = useState(() => !(Array.isArray(todos) && todos.length));
  const [error, setError] = useState('');
  const [zona, setZona] = useState('');
  const [reintento, setReintento] = useState(0);

  // Datos: usa lo ya cargado y mejora a colección completa en fondo sin bloquear el mapa.
  useEffect(() => {
    let vivo = true;
    if (Array.isArray(todos) && todos.length > 0) {
      setFuente((prev) => (prev.length ? prev : [...todos]));
      setCargando(false);
    }
    // No bloquear el mapa por el fetch: lo lanzamos en fondo. Si falla, seguimos con `todos`.
    fetchRestaurants()
      .then((l) => {
        if (!vivo) return;
        if (Array.isArray(l) && l.length) {
          setFuente(l);
          setError('');
        }
        setCargando(false);
      })
      .catch((e) => {
        if (!vivo) return;
        // Si ya tenemos algo, no es error bloqueante
        if (fuente.length > 0 || (Array.isArray(todos) && todos.length > 0)) {
          setCargando(false);
          return;
        }
        setError(e.message || 'No se pudo cargar el mapa.');
        setCargando(false);
      });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reintento, todos]);

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

  // Crear el mapa cuando el contenedor existe (siempre renderizado, aunque cargando).
  useEffect(() => {
    if (refMapa.current) return undefined;
    if (!refCont.current) return undefined;
    const centroInicial = CENTRO_CATALUNA;
    const mapa = L.map(refCont.current, { zoomControl: true }).setView(
      [centroInicial.lat, centroInicial.lng],
      centroInicial.zoom,
    );
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);
    refMapa.current = mapa;
    refCapa.current = L.layerGroup().addTo(mapa);
    refCapaCentro.current = L.layerGroup().addTo(mapa);
    const t1 = setTimeout(() => mapa.invalidateSize(), 80);
    const t2 = setTimeout(() => mapa.invalidateSize(), 400);
    const t3 = setTimeout(() => mapa.invalidateSize(), 900);
    const onResize = () => mapa.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', onResize);
      mapa.remove();
      refMapa.current = null;
      refCapa.current = null;
      refCapaCentro.current = null;
    };
  }, [cargando, fuente.length, zona]);

  // Repintar marcadores al cambiar zona/datos + clic en popup.
  useEffect(() => {
    const mapa = refMapa.current;
    const capa = refCapa.current;
    const capaCentro = refCapaCentro.current;
    if (!mapa || !capa) return undefined;
    capa.clearLayers();
    if (capaCentro) capaCentro.clearLayers();

    const centro = centroDeZona(zona);
    if (zona && capaCentro) {
      const mkCentro = L.marker([centro.lat, centro.lng], {
        icon: iconoCentro(),
        title: `Centro de ${centro.nombre || nombreZona(zona)}`,
        keyboard: false,
        zIndexOffset: 1000,
      });
      mkCentro.bindTooltip(`Centro de ${escapar(centro.nombre || nombreZona(zona))}`, {
        permanent: false,
        direction: 'top',
      });
      mkCentro.addTo(capaCentro);
    }

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
        `<strong>${escapar(r.nombre)}</strong><br>` +
          `★ ${escapar(r.valoracion ?? '—')} · ${escapar(r.precio)} · ${escapar(nombreZona(r.zona))}<br>` +
          `<button data-ver-detalle="${escapar(r.id)}" style="margin-top:0.4rem">Ver detalle</button>`,
      );
      mk.addTo(capa);
      puntos.push([r.coords.lat, r.coords.lng]);
    });

    if (puntos.length > 1) {
      mapa.fitBounds(puntos, { padding: [30, 30], maxZoom: 13 });
    } else if (puntos.length === 1) {
      mapa.setView(puntos[0], 15);
    } else if (zona) {
      mapa.setView([centro.lat, centro.lng], centro.zoom || 13);
    } else if (fuente.length === 0) {
      mapa.setView([CENTRO_CATALUNA.lat, CENTRO_CATALUNA.lng], CENTRO_CATALUNA.zoom);
    }
    // Revalidar por si el fitBounds se hizo con contenedor aún a 0
    setTimeout(() => mapa.invalidateSize(), 80);
    setTimeout(() => mapa.invalidateSize(), 300);

    function alAbrirPopup(e) {
      const btn = e.popup?.getElement()?.querySelector('[data-ver-detalle]');
      if (btn) {
        btn.onclick = () => {
          const hallado = visibles.find((x) => String(x.id) === btn.getAttribute('data-ver-detalle'));
          if (hallado) onVerDetalle(hallado);
        };
      }
    }
    mapa.on('popupopen', alAbrirPopup);
    return () => {
      mapa.off('popupopen', alAbrirPopup);
    };
  }, [visibles, zona, fuente.length, onVerDetalle]);

  const zonas = useMemo(
    () => [...new Set([...ZONAS_CATALUNA, ...Object.keys(porZona)])],
    [porZona],
  );

  const mapaVacio = !cargando && fuente.length === 0 && !error;

  return (
    <section className="auth-pagina pagina-ancha" aria-labelledby="mapa-titulo">
      <div className="auth-tarjeta tarjeta-ancha">
        <h1 id="mapa-titulo">Mapa por zonas</h1>

        <div className="tabs" role="group" aria-label="Filtrar por zona">
          <button
            type="button"
            aria-pressed={zona === ''}
            className={zona === '' ? 'btn-cta btn-peq' : 'btn-secundario btn-peq'}
            onClick={() => setZona('')}
          >
            Todas ({fuente.length || total || 0})
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
          {cargando
            ? 'Cargando locales…'
            : `${visibles.length} locales en el mapa${zona ? ` · ${nombreZona(zona)} (centrado en su centro)` : ''}.`}
        </p>

        {error && fuente.length === 0 && (
          <div className="error-panel" role="alert" style={{ marginBottom: '0.8rem' }}>
            <p className="vacio-titulo">No se pudo cargar el mapa.</p>
            <p>{error}</p>
            <button type="button" className="btn-cta" onClick={() => setReintento((i) => i + 1)}>
              Reintentar
            </button>
          </div>
        )}

        {mapaVacio && <p className="vacio-texto">Aún no hay locales con coordenadas para mostrar.</p>}

        {/* El mapa SIEMPRE en el DOM: si no, Leaflet no inicializa (altura 0) */}
        <div ref={refCont} className="mapa-grande" role="application" aria-label="Mapa de restaurantes" />

        {cargando && fuente.length === 0 && <p className="vacio-texto">Cargando mapa…</p>}
      </div>
    </section>
  );
}
