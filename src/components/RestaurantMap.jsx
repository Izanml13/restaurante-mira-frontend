/**
 * Mapa Leaflet del restaurante + parkings cercanos (react-leaflet).
 * - Marker rojo restaurante, markers azules parkings
 * - Marker seleccionado resaltado (borde dorado)
 * - fitBounds automático con padding 40px, maxZoom 16
 * - Atribución OSM + Geoapify (requerida en plan gratis)
 */
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

function crearIcono(color, selected) {
  const size = selected ? 34 : 28;
  const border = selected ? '3px solid #f59e0b' : '2px solid #fff';
  return L.divIcon({
    className: '',
    html: `<span style="display:inline-grid;place-items:center;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:0 1px 6px rgba(0,0,0,0.35);transition:all .2s;"><span style="width:${selected ? 12 : 10}px;height:${selected ? 12 : 10}px;border-radius:50%;background:#fff;display:block"></span></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

const iconoRestaurante = crearIcono('#d92d20', false);
const iconoParking = crearIcono('#2563eb', false);
const iconoParkingSeleccionado = crearIcono('#2563eb', true);

function FitBounds({ puntos }) {
  const map = useMap();
  useEffect(() => {
    if (!puntos.length) return;
    if (puntos.length === 1) {
      map.setView(puntos[0], 15);
    } else {
      map.fitBounds(puntos, { padding: [40, 40], maxZoom: 16 });
    }
    setTimeout(() => map.invalidateSize(), 100);
  }, [map, puntos]);
  return null;
}

function FlyToPunto({ punto }) {
  const map = useMap();
  useEffect(() => {
    if (punto) map.flyTo(punto, 16, { duration: 0.8 });
  }, [map, punto]);
  return null;
}

export default function RestaurantMap({ restaurant, parkings = [], selectedIndex, onMapReady }) {
  const coords = restaurant?.coords;
  const mapRef = useRef(null);

  useEffect(() => {
    if (onMapReady && mapRef.current) onMapReady(mapRef.current);
  }, [onMapReady]);

  if (!coords) return null;

  const puntos = [[coords.lat, coords.lng], ...parkings.map((p) => [p.lat, p.lon])];
  const seleccionado = selectedIndex != null ? parkings[selectedIndex] : null;

  return (
    <div className="restaurant-map" role="application" aria-label={`Mapa de ${restaurant.nombre} con parkings cercanos`}>
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | POIs by <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[coords.lat, coords.lng]} icon={iconoRestaurante}>
          <Popup>
            <strong>{restaurant.nombre}</strong>
            <br />
            {restaurant.direccion || restaurant.ciudad || ''}
          </Popup>
        </Marker>
        {parkings.map((p, i) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lon]}
            icon={i === selectedIndex ? iconoParkingSeleccionado : iconoParking}
          >
            <Popup>
              <strong>{p.nombre}</strong>
              <br />
              {p.direccion}
              <br />
              {p.gratuito === 'yes' ? 'Gratis' : 'Pago'}
              {p.tipo !== '—' ? ` · ${p.tipo}` : ''}
              {p.distanciaMetros != null ? ` · ${p.distanciaMetros} m` : ''}
            </Popup>
          </Marker>
        ))}
        <FitBounds puntos={puntos} />
        {seleccionado && <FlyToPunto punto={[seleccionado.lat, seleccionado.lon]} />}
      </MapContainer>
    </div>
  );
}
