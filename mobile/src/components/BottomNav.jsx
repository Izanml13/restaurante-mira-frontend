/**
 * Bottom navigation glass dock (≤767px) — espejo de .bottom-nav del web:
 * explorar, mapa, reservas, favoritos y perfil (racha y puntos, arriba).
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import { useTheme } from '../theme/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import { useBreakpoint } from '../theme/responsive';
import { FUENTES } from '../theme/tokens';
import { IconoBusqueda, IconoCalendario, IconoCorazon, IconoMapa, IconoPersona } from './shell/Iconos';
import { rutaDesdePath } from './shell/rutas';

const TRADS = { es, ca, en };

export default function BottomNav({ numReservas = 0 }) {
  const t = useT(TRADS);
  const { colores, esOscuro } = useTheme();
  const auth = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { esMovil } = useBreakpoint();

  if (!esMovil) return null;

  const ruta = rutaDesdePath(pathname);
  const numFavoritos = auth.favoritos?.length || 0;

  const tabs = [
    {
      id: 'home',
      label: t('bottomNav.explorar'),
      ruta: '/',
      icon: (c) => <IconoBusqueda size={22} color={c} />,
    },
    {
      id: 'mapa',
      label: t('nav.mapa'),
      ruta: '/mapa',
      icon: (c) => <IconoMapa size={22} color={c} />,
    },
    {
      id: 'reservas',
      label: t('bottomNav.reservas'),
      ruta: '/reservas',
      badge: numReservas,
      icon: (c) => <IconoCalendario size={22} color={c} />,
    },
    {
      id: 'favoritos',
      label: t('bottomNav.favoritos'),
      ruta: '/favoritos',
      badge: numFavoritos,
      icon: (c) => <IconoCorazon size={22} color={c} />,
    },
    {
      id: 'cuenta',
      label: t('bottomNav.perfil'),
      ruta: '/cuenta',
      icon: (c) => <IconoPersona size={22} color={c} />,
    },
  ];

  function irar(r) {
    if (pathname !== r) router.push(r);
  }

  return (
    <View style={[styles.nav, { borderTopColor: colores.glassBorder, backgroundColor: colores.glassBg, paddingBottom: insets.bottom }]}>
      <BlurView intensity={30} tint={esOscuro ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>
        {tabs.map((tab) => {
          const activa = ruta === tab.id;
          const color = activa ? colores.primaryContainer : colores.gris;
          return (
            <Pressable
              key={tab.id}
              onPress={() => irar(tab.ruta)}
              accessibilityRole="link"
              accessibilityState={{ selected: activa }}
              accessibilityLabel={tab.label}
              style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
            >
              {tab.icon(color)}
              <Text style={[styles.itemTxt, { color }]} numberOfLines={1}>
                {tab.label}
              </Text>
              {tab.badge > 0 && (
                <View style={[styles.badge, { backgroundColor: colores.tertiaryContainer }]}>
                  <Text style={styles.badgeTxt}>{tab.badge}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    borderTopWidth: 1,
    paddingVertical: 6.4,
    overflow: 'hidden',
    zIndex: 150,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  item: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2.4,
    paddingVertical: 4.8,
    paddingHorizontal: 9.6,
    position: 'relative',
    minWidth: 56,
  },
  itemTxt: {
    fontSize: 10.88,
    fontWeight: '600',
    fontFamily: FUENTES.textoSemi,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 1.6,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3.2,
  },
  badgeTxt: {
    color: '#fff',
    fontSize: 9.6,
    fontWeight: '800',
    fontFamily: FUENTES.textoExtra,
  },
});
