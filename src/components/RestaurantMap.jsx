/**
 * Mapa del restaurante + parkings cercanos (Overpass API, sin claves).
 * Muestra el local y los parkings recomendados alrededor.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buscarParkingsCercanos, formatoDistancia, mapsLink, buscarParkingEnGoogle } from '../services/parkingApi.js';

function escapar(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function RestaurantMap({ restaurant }) {
  const refCont = useRef(null);
  const refMapa = useRef(null);
  const refCapa = useRef(null);
  const [parkings, setParkings] = useState([]);
  const [cargando, setCargando] = useState(true);

  const coords = restaurant?.coords || null;
  const id = restaurant?.id;

  const puntos = useMemo(() => {
    if (!coords) return [];
    return [
      { lat: coords.lat, lng: coords.lng },
      ...parkings.map((p) => ({ lat: p.lat, lng: p.lng })),
    ];
  }, [coords, parkings]);

  // Cargar parkings una vez por restaurante (radio base 1,5 km; el servicio
  // amplía solo a 2-3 km si sale vacío).
  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setParkings([]);
    if (!coords) {
      setCargando(false);
      return undefined;
    }
    buscarParkingsCercanos(coords.lat, coords.lng, { radio: 1500, limite: 5 })
      .then((l) => {
        if (!vivo) return;
        setParkings(Array.isArray(l) ? l : []);
        setCargando(false);
      })
      .catch(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Crear mapa cuando el contenedor existe (siempre renderizado si hay coords).
  useEffect(() => {
    if (!coords) return undefined;
    if (refMapa.current) return undefined;
    if (!refCont.current) return undefined;
    const mapa = L.map(refCont.current, { zoomControl: true }).setView([coords.lat, coords.lng], 16);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);
    refMapa.current = mapa;
    refCapa.current = L.layerGroup().addTo(mapa);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, coords, cargando]);

  // Fallback: si el contenedor apareció después (cargando), reintenta crear
  useEffect(() => {
    if (refMapa.current || !refCont.current || !coords) return;
    const mapa = L.map(refCont.current, { zoomControl: true }).setView([coords.lat, coords.lng], 16);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);
    refMapa.current = mapa;
    refCapa.current = L.layerGroup().addTo(mapa);
    setTimeout(() => mapa.invalidateSize(), 80);
    return () => {
      mapa.remove();
      refMapa.current = null;
      refCapa.current = null;
    };
  }, [coords]);

  // Repintar restaurante + parkings.
  useEffect(() => {
    const mapa = refMapa.current;
    const capa = refCapa.current;
    if (!mapa || !capa || !coords) return undefined;
    capa.clearLayers();

    const mkRest = L.circleMarker([coords.lat, coords.lng], {
      radius: 10,
      color: '#b03a2e',
      weight: 3,
      fillColor: '#e74c3c',
      fillOpacity: 0.95,
    });
    mkRest.bindPopup(
      `<strong>${escapar(restaurant.nombre)}</strong><br>${escapar(restaurant.direccion || restaurant.ciudad || '')}`,
    );
    mkRest.addTo(capa);

    parkings.forEach((p) => {
      const icono = L.divIcon({
        className: 'parking-pin',
        html: `<span aria-hidden="true">P</span>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const mk = L.marker([p.lat, p.lng], { icon: icono, title: p.nombre });
      mk.bindPopup(
        `<strong>${escapar(p.nombre)}</strong><br>Parking ${escapar(formatoDistancia(p.distanciaM))} del restaurante<br>` +
          `<a href="${escapar(mapsLink(p.lat, p.lng))}" target="_blank" rel="noreferrer">Cómo llegar al parking</a>`,
      );
      mk.addTo(capa);
    });

    if (puntos.length > 1) {
      mapa.fitBounds(
        puntos.map((p) => [p.lat, p.lng]),
        { padding: [35, 35], maxZoom: 16 },
      );
    } else {
      mapa.setView([coords.lat, coords.lng], 16);
    }
    setTimeout(() => mapa.invalidateSize(), 80);
    setTimeout(() => mapa.invalidateSize(), 300);
    return undefined;
  }, [puntos, coords, parkings, restaurant]);

  if (!coords) {
    return <p className="modal-mapa-vacio">Este local no tiene coordenadas disponibles.</p>;
  }

  const mejor = parkings[0] || null;

  return (
    <section className="mapa-detalle-wrap" aria-label={`Mapa de ${restaurant.nombre} con parkings`}>
      <div
        ref={refCont}
        className="mapa-detalle"
        role="application"
        aria-label={`Ubicación de ${restaurant.nombre} y parkings cercanos`}
      />
      <p className="mapa-mini-pie">
        {restaurant.direccion || restaurant.ciudad}
        {cargando
          ? ' · Buscando parkings cercanos…'
          : mejor
            ? ` · Parking recomendado: ${mejor.nombre} (${formatoDistancia(mejor.distanciaM)})`
            : parkings.length === 0
              ? ' · Sin parkings registrados en OpenStreetMap hasta 3 km.'
              : ''}
      </p>
      {!cargando && parkings.length > 0 && (
        <ul className="parking-lista" aria-label="Parkings cercanos">
          {parkings.slice(0, 3).map((p) => (
            <li key={p.id}>
              <strong>P</strong> {p.nombre} · {formatoDistancia(p.distanciaM)} ·{' '}
              <a href={mapsLink(p.lat, p.lng)} target="_blank" rel="noreferrer">
                Cómo llegar
              </a>
            </li>
          ))}
        </ul>
      )}
      {!cargando && parkings.length === 0 && (
        <p className="vacio-texto" style={{ fontSize: '0.82rem', margin: 0 }}>
          Sin parkings OSM hasta 3 km (en pueblos hay pocos mapeados).{' '}
          <a
            href={buscarParkingEnGoogle(coords.lat, coords.lng)}
            target="_blank"
            rel="noreferrer"
          >
            Buscar parking en Google Maps
          </a>
          .
        </p>
      )}
    </section>
  );
}
