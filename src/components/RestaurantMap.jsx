/**
 * Mapa Leaflet del restaurante + parkings cercanos (react-leaflet).
 * - Marker rojo restaurante, markers azules parkings
 * - fitBounds automático con padding 40px
 * - OSM TileLayer con attribution
 */
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

function crearIcono(color) {
  return L.divIcon({
    className: '',
    html: `<span style="display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.35);"><span style="width:10px;height:10px;border-radius:50%;background:#fff;display:block"></span></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

const iconoRestaurante = crearIcono('#d92d20');
const iconoParking = crearIcono('#2563eb');

function FitBounds({ puntos }) {
  const map = useMap();
  useEffect(() => {
    if (!puntos.length) return;
    if (puntos.length === 1) {
      map.setView(puntos[0], 15);
    } else {
      map.fitBounds(puntos, { padding: [40, 40] });
    }
    setTimeout(() => map.invalidateSize(), 100);
  }, [map, puntos]);
  return null;
}

export default function RestaurantMap({ restaurant, parkings = [] }) {
  const coords = restaurant?.coords;
  if (!coords) return null;

  const puntos = [[coords.lat, coords.lng], ...parkings.map((p) => [p.lat, p.lng])];

  return (
    <div className="restaurant-map" role="application" aria-label={`Mapa de ${restaurant.nombre} con parkings cercanos`}>
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[coords.lat, coords.lng]} icon={iconoRestaurante}>
          <Popup>
            <strong>{restaurant.nombre}</strong>
            <br />
            {restaurant.direccion || restaurant.ciudad || ''}
          </Popup>
        </Marker>
        {parkings.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={iconoParking}>
            <Popup>
              <strong>{p.nombre}</strong>
              <br />
              {p.gratuito === 'yes' ? 'Gratis' : p.gratuito === 'no' ? 'Pago' : '—'}
              {p.plazas != null ? ` · ${p.plazas} plazas` : ''}
              {p.distanciaM != null ? ` · ${p.distanciaM} m` : ''}
            </Popup>
          </Marker>
        ))}
        <FitBounds puntos={puntos} />
      </MapContainer>
    </div>
  );
}
