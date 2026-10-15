/**
 * Mapa del restaurante + parkings — espejo de .restaurant-map (react-leaflet):
 * marcador rojo local, azules parkings, seleccionado con borde dorado,
 * encuadre de todos los puntos y zoom al parking elegido. Tiles OpenStreetMap
 * con Leaflet en un WebView (MapaLeaflet), sin claves de Google.
 */
import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import { useTheme } from '../theme/ThemeContext';
import { RADIO } from '../theme/tokens';
import MapaLeaflet from './MapaLeaflet';

const TRADS = { es, ca, en };

function coordsValidas(coords) {
  return (
    Boolean(coords) && Number.isFinite(Number(coords.lat)) && Number.isFinite(Number(coords.lng))
  );
}

export default function RestaurantMap({ restaurant, parkings = [], selectedIndex, alto = 380 }) {
  const t = useT(TRADS);
  const { colores } = useTheme();
  const coords = restaurant?.coords;
  const centroValido = coordsValidas(coords);

  const parkingsValidos = useMemo(
    () => parkings.filter((p) => Number.isFinite(Number(p?.lat)) && Number.isFinite(Number(p?.lon))),
    [parkings],
  );

  const puntos = useMemo(() => {
    if (!centroValido) return [];
    return [
      {
        id: 'local',
        lat: Number(coords.lat),
        lng: Number(coords.lng),
        color: '#d92d20',
        radio: 11,
        titulo: restaurant.nombre,
        texto: restaurant.direccion || restaurant.ciudad || '',
      },
      ...parkingsValidos.map((p, i) => ({
        id: `p${i}`,
        lat: Number(p.lat),
        lng: Number(p.lon),
        color: '#2563eb',
        seleccionado: i === selectedIndex,
        titulo: p.nombre,
        texto: [
          p.direccion,
          p.gratuito === 'yes' ? t('otros.gratis') : t('otros.pago'),
          p.tipo !== '—' ? p.tipo : '',
          p.distanciaMetros != null ? `${p.distanciaMetros} m` : '',
        ].filter(Boolean).join(' · '),
      })),
    ];
  }, [centroValido, coords, restaurant, parkingsValidos, selectedIndex, t]);

  const elegido = selectedIndex != null ? parkingsValidos[selectedIndex] : null;
  const encuadre = useMemo(
    () => (elegido ? { lat: Number(elegido.lat), lng: Number(elegido.lon), zoom: 16 } : null),
    [elegido],
  );

  if (!centroValido) return null;

  return (
    <View
      style={[styles.wrap, { height: alto, borderColor: colores.glassBorder, backgroundColor: colores.fondoSuave, borderRadius: RADIO.peq }]}
      accessibilityLabel={`${t('otros.mapaPorZonas')} — ${restaurant.nombre}`}
    >
      <MapaLeaflet puntos={puntos} encuadre={encuadre} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
});
