/**
 * Ruta /llegada?id=<restauranteId> (G09): oferta de llegada, QR para enseñar
 * al personal, cuenta atrás y estado (pendiente → aplicada / caducada, con
 * botón para pedir otro). Misma lógica que la web (useLlegada + llegadaModel).
 */
import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { AppShell } from '../components/shell/AppShell';
import useUbicacion from '../hooks/useUbicacion.js';
import useLlegada from '../hooks/useLlegada.js';
import { trazadoQR, segundosRestantes, formatoCuenta } from '../models/llegadaModel.js';
import { fetchRestaurantePorId } from '../services/restaurantApi.js';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import { useTheme } from '../theme/ThemeContext';
import { FUENTES, RADIO, sombraCard } from '../theme/tokens';

const TRADS = { es, ca, en };

function CodigoQR({ texto }) {
  const { size, d } = useMemo(() => trazadoQR(texto), [texto]);
  return (
    <Svg width={240} height={240} viewBox={`-2 -2 ${size + 4} ${size + 4}`} accessibilityLabel="QR">
      <Rect x={-2} y={-2} width={size + 4} height={size + 4} fill="#fff" />
      <Path d={d} fill="#002218" />
    </Svg>
  );
}

function Boton({ texto, onPress, colores }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.boton, { backgroundColor: colores.primaryContainer }, pressed && { opacity: 0.85 }]}
    >
      <Text style={styles.botonTxt}>{texto}</Text>
    </Pressable>
  );
}

export default function Llegada() {
  const t = useT(TRADS);
  const router = useRouter();
  const { colores } = useTheme();
  const { id } = useLocalSearchParams();
  const restauranteId = String(id || '');
  const { activa, posicion } = useUbicacion();
  const { fase, visita, qr, estado, distanciaM, ahora, pedir } = useLlegada(restauranteId, posicion);
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    let vivo = true;
    fetchRestaurantePorId(restauranteId).then((r) => vivo && r && setNombre(r.nombre)).catch(() => {});
    return () => { vivo = false; };
  }, [restauranteId]);

  const restantes = visita ? segundosRestantes(visita.caducaEn, ahora) : 0;
  const txt = (s, extra) => <Text style={[styles.texto, { color: colores.tinta }, extra]}>{s}</Text>;

  let cuerpo;
  if (!activa) {
    cuerpo = (
      <View style={styles.aviso}>
        {txt(t('llegada.activaUbicacion'))}
        <Boton texto={t('llegada.irACuenta')} onPress={() => router.push('/cuenta')} colores={colores} />
      </View>
    );
  } else if (fase === 'esperandoUbicacion' || fase === 'creando') {
    cuerpo = (
      <View style={styles.aviso}>
        <ActivityIndicator color={colores.primaryContainer} />
        {txt(t('llegada.buscando'), { color: colores.gris })}
      </View>
    );
  } else if (fase === 'lejos') {
    cuerpo = (
      <View style={styles.aviso} accessibilityRole="alert">
        {txt(distanciaM != null ? t('llegada.lejos', { m: distanciaM }) : t('llegada.lejosSinDato'))}
        <Boton texto={t('llegada.reintentar')} onPress={pedir} colores={colores} />
      </View>
    );
  } else if (fase === 'sinSesion') {
    cuerpo = (
      <View style={styles.aviso}>
        {txt(t('llegada.sinSesion'))}
        <Boton texto={t('nav.iniciarSesion')} onPress={() => router.push('/login')} colores={colores} />
      </View>
    );
  } else if (fase !== 'qr') {
    cuerpo = (
      <View style={styles.aviso} accessibilityRole="alert">
        {txt(t(`llegada.${fase}`))}
        <Boton texto={t('llegada.reintentar')} onPress={pedir} colores={colores} />
      </View>
    );
  } else {
    cuerpo = (
      <>
        <View style={[styles.oferta, { backgroundColor: colores.verdeSuave }]}>
          <Text style={[styles.ofertaEtq, { color: colores.gris }]}>{t('llegada.tuOferta')}</Text>
          <Text style={[styles.ofertaTxt, { color: colores.verde }]}>{visita.nivel?.texto}</Text>
        </View>
        {estado === 'confirmada' ? (
          <View style={[styles.ok, { backgroundColor: colores.verdeSuave }]} accessibilityRole="alert">
            <View style={[styles.okIcono, { backgroundColor: colores.primaryContainer }]}>
              <Text style={styles.okMarca}>✓</Text>
            </View>
            <Text style={[styles.okTitulo, { color: colores.tinta }]}>{t('llegada.aplicada')}</Text>
            {txt(t('llegada.aplicadaTexto'), { textAlign: 'center' })}
          </View>
        ) : (
          <View style={[styles.qrCaja, { backgroundColor: colores.papel, borderColor: colores.glassBorder }, sombraCard(colores)]}>
            <View style={estado === 'caducada' && { opacity: 0.15 }}>
              <CodigoQR texto={qr} />
            </View>
            {estado === 'pendiente' ? (
              <Text style={[styles.estado, { color: colores.gris }]} accessibilityLiveRegion="polite">
                {t('llegada.ensenalo')} · {t('llegada.caducaEn', { t: formatoCuenta(restantes) })}
              </Text>
            ) : (
              <View style={styles.aviso}>
                {txt(t('llegada.caducado'))}
                <Boton texto={t('llegada.otroQR')} onPress={pedir} colores={colores} />
              </View>
            )}
          </View>
        )}
      </>
    );
  }

  return (
    <AppShell>
      <View style={styles.pagina}>
        <Text style={[styles.ojo, { color: colores.dorado }]}>📍 {nombre || 'MIRA'}</Text>
        <Text style={[styles.titulo, { color: colores.tinta }]} accessibilityRole="header">
          {fase === 'lejos' ? t('llegada.tituloLejos') : t('llegada.titulo')}
        </Text>
        {cuerpo}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  pagina: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, gap: 16, alignItems: 'stretch' },
  ojo: { fontFamily: FUENTES.textoBold, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  titulo: { fontFamily: FUENTES.display, fontSize: 32, lineHeight: 38, textAlign: 'center' },
  texto: { fontFamily: FUENTES.texto, fontSize: 15.5, lineHeight: 22, textAlign: 'center' },
  aviso: { alignItems: 'center', gap: 14, paddingVertical: 8 },
  boton: { height: 48, borderRadius: 24, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  botonTxt: { color: '#fff', fontFamily: FUENTES.textoBold, fontSize: 15.5 },
  oferta: { borderRadius: RADIO.md, padding: 16, alignItems: 'center', gap: 2 },
  ofertaEtq: { fontFamily: FUENTES.texto, fontSize: 13 },
  ofertaTxt: { fontFamily: FUENTES.textoBold, fontSize: 20 },
  qrCaja: { borderRadius: RADIO.xl, borderWidth: 1, padding: 20, alignItems: 'center', gap: 12 },
  estado: { fontFamily: FUENTES.texto, fontSize: 14.5, fontVariant: ['tabular-nums'] },
  ok: { borderRadius: RADIO.xl, padding: 24, alignItems: 'center', gap: 8 },
  okIcono: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  okMarca: { color: '#fff', fontSize: 30, fontWeight: '700' },
  okTitulo: { fontFamily: FUENTES.textoBold, fontSize: 20 },
});
