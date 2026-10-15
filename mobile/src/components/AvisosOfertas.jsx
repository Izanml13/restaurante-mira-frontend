/**
 * Avisos por distancia (G06) dentro de la app: tarjetas flotantes encima de la
 * barra inferior. "Ver" abre la ficha del restaurante.
 */
import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import { useTheme } from '../theme/ThemeContext';
import { FUENTES, RADIO, sombraFlotante } from '../theme/tokens';
import useAvisosOfertas from '../hooks/useAvisosOfertas';

const TRADS = { es, ca, en };
const DURACION_MS = 20_000;

function Aviso({ aviso, onCerrar, t }) {
  const { colores } = useTheme();
  const router = useRouter();
  useEffect(() => {
    const id = setTimeout(onCerrar, DURACION_MS);
    return () => clearTimeout(id);
  }, [onCerrar]);

  const { restaurante, nivel, distanciaM } = aviso;
  const llegada = nivel.distancia === 20;
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.aviso,
        { backgroundColor: colores.papel, borderColor: colores.glassBorder, borderLeftColor: llegada ? colores.primaryContainer : colores.doradoClaro },
        sombraFlotante(colores),
      ]}
    >
      <Text style={styles.icono}>{llegada ? '📍' : '🎯'}</Text>
      <View style={styles.texto}>
        <Text numberOfLines={1} style={[styles.nombre, { color: colores.tinta }]}>{restaurante.nombre}</Text>
        <Text numberOfLines={1} style={[styles.nivel, { color: colores.verde }]}>{nivel.texto}</Text>
        <Text numberOfLines={1} style={[styles.dist, { color: colores.textoSec }]}>
          {llegada ? t('ofertasCerca.llegada') : t('ofertasCerca.aDistancia', { m: distanciaM })}
        </Text>
      </View>
      <Pressable
        onPress={() => { onCerrar(); router.push({ pathname: '/detalle', params: { id: String(restaurante.id) } }); }}
        accessibilityRole="button"
        style={({ pressed }) => [styles.ver, { backgroundColor: colores.primaryContainer }, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.verTxt}>{t('ofertasCerca.ver')}</Text>
      </Pressable>
      <Pressable onPress={onCerrar} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('ofertasCerca.cerrar')} style={styles.cerrar}>
        <Text style={{ color: colores.textoSec, fontSize: 16 }}>✕</Text>
      </Pressable>
    </View>
  );
}

export default function AvisosOfertas() {
  const t = useT(TRADS);
  const insets = useSafeAreaInsets();
  const { avisos, descartar } = useAvisosOfertas(t);
  if (!avisos.length) return null;
  return (
    <View pointerEvents="box-none" style={[styles.pila, { bottom: insets.bottom + 72 }]}>
      {avisos.map((a) => (
        <Aviso key={`${a.restaurante.id}:${a.nivel.distancia}`} aviso={a} onCerrar={() => descartar(a)} t={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pila: { position: 'absolute', left: 12, right: 12, gap: 8, zIndex: 300 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: RADIO.md, borderWidth: 1, borderLeftWidth: 4 },
  icono: { fontSize: 22 },
  texto: { flex: 1, minWidth: 0 },
  nombre: { fontFamily: FUENTES.textoBold, fontSize: 15 },
  nivel: { fontFamily: FUENTES.textoBold, fontSize: 14 },
  dist: { fontFamily: FUENTES.texto, fontSize: 12.5 },
  ver: { height: 36, paddingHorizontal: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  verTxt: { color: '#fff', fontFamily: FUENTES.textoBold, fontSize: 14 },
  cerrar: { width: 28, alignItems: 'center' },
});
