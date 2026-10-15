/**
 * Barra superior de la app en móvil (≤767): una sola fila nativa.
 * [atrás | logo] ······ [racha] [puntos] [menú]
 * El menú es una hoja inferior con el resto de destinos, idioma, tema y sesión.
 * Se oculta al bajar, como antes.
 */
import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, Image, Animated, Modal, ScrollView, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT, useI18n } from '../../i18n/index.jsx';
import es from '../../i18n/es.js';
import ca from '../../i18n/ca.js';
import en from '../../i18n/en.js';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { useStreak } from '../../context/StreakContext';
import { FUENTES, RADIO } from '../../theme/tokens';
import { IMG } from '../../theme/imagenes';
import { rutaDesdePath } from './rutas';
import {
  IconoAtras, IconoMenu, IconoCerrar, IconoTema, IconoMapa, IconoMensaje, IconoFlecha,
  IconoPersona, IconoRejilla, IconoSalir, IconoCorazon,
} from './Iconos';

const TRADS = { es, ca, en };

/** Pantallas raíz (pestañas): sin flecha atrás. */
const RAICES = ['home', 'mapa', 'reservas', 'favoritos', 'cuenta', 'login'];

export default function BarraMovil({ oculto = false, onAltoChange }) {
  const t = useT(TRADS);
  const { lang, setLang, available } = useI18n();
  const { colores, esOscuro, alternarTema } = useTheme();
  const auth = useAuthContext();
  const streak = useStreak();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [menu, setMenu] = useState(false);
  const [alto, setAlto] = useState(insets.top + 56);
  const [anim] = useState(() => new Animated.Value(0));
  const [cargandoRacha, setCargandoRacha] = useState(false);

  const ruta = rutaDesdePath(pathname);
  const conAtras = !RAICES.includes(ruta) && router.canGoBack();
  const { usuario, perfil, noLeidos } = auth;

  useEffect(() => {
    Animated.timing(anim, { toValue: oculto ? -alto : 0, duration: 220, useNativeDriver: true }).start();
  }, [oculto, alto, anim]);

  const medir = useCallback((h) => { setAlto(h); onAltoChange?.(h); }, [onAltoChange]);

  function ir(destino) {
    setMenu(false);
    if (pathname !== destino) router.push(destino);
  }

  async function salir() {
    setMenu(false);
    try { await auth.cerrarSesion(); } catch { /* noop */ }
    router.replace('/');
  }

  async function abrirRacha() {
    if (cargandoRacha || !usuario) return;
    setCargandoRacha(true);
    try {
      const data = await streak.fetchStreakData();
      streak.openStreakPopup(data || { racha: { dias: 0 }, puntos: 0, yaReclamado: false });
    } catch {
      streak.openStreakPopup({ racha: { dias: 0 }, puntos: 0, yaReclamado: false });
    } finally {
      setCargandoRacha(false);
    }
  }

  const btnIcono = ({ pressed }) => [styles.btnIcono, pressed && { backgroundColor: colores.fondoSuave }];

  return (
    <>
      <Animated.View
        onLayout={(e) => medir(e.nativeEvent.layout.height)}
        style={[styles.raiz, { transform: [{ translateY: anim }] }]}
        accessibilityRole="header"
      >
        <View style={[styles.barra, { paddingTop: insets.top, backgroundColor: colores.glassBg, borderBottomColor: colores.glassBorder }]}>
          <BlurView intensity={30} tint={esOscuro ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.fila}>
            {conAtras ? (
              <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Atrás" hitSlop={8} style={btnIcono}>
                <IconoAtras color={colores.tinta} />
              </Pressable>
            ) : null}
            <Pressable onPress={() => ir('/')} accessibilityRole="link" accessibilityLabel="MIRA - inicio" style={styles.logo}>
              <Image source={IMG.logo} style={styles.logoImg} resizeMode="contain" />
            </Pressable>

            <View style={{ flex: 1 }} />

            {usuario && (
              <>
                <Pressable
                  onPress={abrirRacha}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir racha diaria"
                  style={({ pressed }) => [styles.chip, { backgroundColor: '#FEF3C7' }, (pressed || cargandoRacha) && { opacity: 0.7 }]}
                >
                  <Image source={IMG.rachaFuego} style={styles.chipImg} resizeMode="contain" />
                </Pressable>
                <Pressable
                  onPress={() => ir('/puntos')}
                  accessibilityRole="link"
                  accessibilityLabel={`${t('points.title')}: ${streak.puntosSaldo || 0}`}
                  style={({ pressed }) => [styles.chip, { backgroundColor: colores.verdeSuave }, pressed && { opacity: 0.7 }]}
                >
                  <Image source={IMG.moneda} style={styles.chipImg} resizeMode="contain" />
                  <Text style={[styles.chipTxt, { color: colores.verde }]}>{streak.puntosSaldo || 0}</Text>
                </Pressable>
              </>
            )}

            {perfil?.tipo === 'empresa' && (
              <Pressable
                onPress={() => ir('/dashboard')}
                accessibilityRole="link"
                accessibilityLabel={t('nav.miRestaurante')}
                style={({ pressed }) => [styles.chip, { backgroundColor: colores.primaryContainer }, pressed && { opacity: 0.8 }]}
              >
                <IconoRejilla size={16} color="#fff" />
                <Text style={[styles.chipTxt, { color: '#fff' }]}>Panel</Text>
              </Pressable>
            )}

            <Pressable onPress={() => setMenu(true)} accessibilityRole="button" accessibilityLabel={t('nav.abrirMenu')} style={btnIcono}>
              <IconoMenu color={colores.tinta} />
              {noLeidos > 0 && <View style={[styles.punto, { backgroundColor: colores.tertiaryContainer }]} />}
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <Modal visible={menu} transparent animationType="slide" onRequestClose={() => setMenu(false)} statusBarTranslucent>
        <Pressable style={styles.velo} onPress={() => setMenu(false)} accessibilityLabel={t('nav.cerrarMenu')} />
        <View style={[styles.hoja, { backgroundColor: colores.papel, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.asa, { backgroundColor: colores.borde }]} />
          <View style={styles.hojaCab}>
            <Text style={[styles.hojaTitulo, { color: colores.tinta }]}>MIRA</Text>
            <Pressable onPress={() => setMenu(false)} accessibilityLabel={t('nav.cerrarMenu')} style={btnIcono}>
              <IconoCerrar color={colores.tinta} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 4 }}>
            <Fila icono={<IconoMapa color={colores.verde} />} texto={t('nav.mapa')} onPress={() => ir('/mapa')} colores={colores} />
            {usuario && (
              <Fila
                icono={<IconoMensaje color={colores.verde} />}
                texto={t('mensajes.titulo')}
                extra={noLeidos > 0 ? String(noLeidos) : null}
                onPress={() => ir('/mensajes')}
                colores={colores}
              />
            )}
            <Fila icono={<IconoCorazon color={colores.verde} />} texto={t('nav.favoritos')} onPress={() => ir('/favoritos')} colores={colores} />
            {perfil?.tipo === 'empresa' && (
              <Fila icono={<IconoRejilla color={colores.verde} />} texto={t('nav.miRestaurante')} onPress={() => ir('/dashboard')} colores={colores} />
            )}
            <Fila icono={<IconoMensaje color={colores.verde} />} texto={t('nav.contacto')} onPress={() => ir('/contacto')} colores={colores} />

            <View style={[styles.separador, { backgroundColor: colores.borde }]} />

            <View style={styles.ajuste}>
              <Text style={[styles.ajusteTxt, { color: colores.tinta }]}>{t('cuenta.idioma')}</Text>
              <View style={[styles.segmento, { borderColor: colores.borde }]}>
                {Object.keys(available).map((code) => {
                  const activo = lang === code;
                  return (
                    <Pressable
                      key={code}
                      onPress={() => setLang(code)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: activo }}
                      accessibilityLabel={available[code]}
                      style={[styles.segBtn, activo && { backgroundColor: colores.primaryContainer }]}
                    >
                      <Text style={[styles.segTxt, { color: activo ? '#fff' : colores.gris }]}>{code.toUpperCase()}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Fila
              icono={<IconoTema color={colores.verde} />}
              texto={esOscuro ? t('nav.modoClaro') : t('nav.modoOscuro')}
              onPress={alternarTema}
              colores={colores}
              sinFlecha
            />

            <View style={[styles.separador, { backgroundColor: colores.borde }]} />

            {usuario ? (
              <>
                <Fila icono={<IconoPersona color={colores.verde} />} texto={t('nav.miCuenta')} onPress={() => ir('/cuenta')} colores={colores} />
                <Fila icono={<IconoSalir size={20} color={colores.rojo} />} texto={t('nav.cerrarSesion')} onPress={salir} colores={colores} peligro sinFlecha />
              </>
            ) : (
              <View style={styles.accesos}>
                <Pressable onPress={() => ir('/login')} style={({ pressed }) => [styles.btn, { borderColor: colores.borde }, pressed && { opacity: 0.8 }]}>
                  <Text style={[styles.btnTxt, { color: colores.tinta }]}>{t('nav.iniciarSesion')}</Text>
                </Pressable>
                <Pressable onPress={() => ir('/registro')} style={({ pressed }) => [styles.btn, { backgroundColor: colores.primaryContainer, borderColor: colores.primaryContainer }, pressed && { opacity: 0.85 }]}>
                  <Text style={[styles.btnTxt, { color: '#fff' }]}>{t('nav.crearCuenta')}</Text>
                </Pressable>
              </View>
            )}
            <Pressable onPress={() => ir('/privacidad')} style={styles.legal}>
              <Text style={[styles.legalTxt, { color: colores.textoSec }]}>{t('footer.avisoPrivacidad')}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function Fila({ icono, texto, extra, onPress, colores, peligro = false, sinFlecha = false }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.fila2, pressed && { backgroundColor: colores.fondoSuave }]}
    >
      <View style={[styles.filaIcono, { backgroundColor: colores.verdeSuave }]}>{icono}</View>
      <Text style={[styles.filaTxt, { color: peligro ? colores.rojo : colores.tinta }]}>{texto}</Text>
      {extra ? (
        <View style={[styles.insignia, { backgroundColor: colores.tertiaryContainer }]}>
          <Text style={styles.insigniaTxt}>{extra}</Text>
        </View>
      ) : null}
      {!sinFlecha && <IconoFlecha color={colores.textoSec} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  raiz: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  barra: { borderBottomWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  fila: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 6 },
  btnIcono: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  logo: { backgroundColor: '#fff', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12, marginLeft: 6 },
  logoImg: { height: 20, width: 44 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, minWidth: 34, paddingHorizontal: 8, borderRadius: 17, justifyContent: 'center' },
  chipImg: { width: 18, height: 18 },
  chipTxt: { fontFamily: FUENTES.textoBold, fontSize: 13 },
  punto: { position: 'absolute', top: 10, right: 10, width: 9, height: 9, borderRadius: 5 },

  velo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  hoja: { borderTopLeftRadius: RADIO.xl, borderTopRightRadius: RADIO.xl, paddingHorizontal: 12, maxHeight: '85%' },
  asa: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: 8 },
  hojaCab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8, marginBottom: 4 },
  hojaTitulo: { fontFamily: FUENTES.display, fontSize: 22 },
  fila2: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 52, paddingHorizontal: 8, borderRadius: RADIO.md },
  filaIcono: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filaTxt: { flex: 1, fontFamily: FUENTES.textoSemi, fontSize: 16 },
  insignia: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  insigniaTxt: { color: '#fff', fontFamily: FUENTES.textoBold, fontSize: 12 },
  separador: { height: StyleSheet.hairlineWidth, marginVertical: 8, marginHorizontal: 8 },
  ajuste: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: 8 },
  ajusteTxt: { fontFamily: FUENTES.textoSemi, fontSize: 16 },
  segmento: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, padding: 3, gap: 2 },
  segBtn: { minWidth: 44, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  segTxt: { fontFamily: FUENTES.textoBold, fontSize: 13 },
  accesos: { flexDirection: 'row', gap: 10, paddingHorizontal: 8, paddingVertical: 4 },
  btn: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontFamily: FUENTES.textoBold, fontSize: 15 },
  legal: { alignSelf: 'center', padding: 12 },
  legalTxt: { fontFamily: FUENTES.texto, fontSize: 13 },
});
