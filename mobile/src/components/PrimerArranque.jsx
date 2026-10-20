/**
 * Primer arranque de la app (C02): pasos seguidos cookies → ubicación →
 * notificaciones, también sin sesión. Igual que en la web: cada decisión es un
 * consentimiento RGPD (dispositivo y perfil) y no se vuelve a preguntar.
 * Aceptar lanza directamente el permiso del sistema.
 */
import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Platform } from 'react-native';
import CookieBanner from './CookieBanner.jsx';
import useUbicacion from '../hooks/useUbicacion.js';
import { leerCookies, tieneConsentimiento } from '../services/cookieService.js';
import { leerConsentimientos, decidirConsentimiento, suscribirConsentimientos } from '../services/consentimientosApi.js';
import { pedirPermisoNotificaciones, registrarPush } from '../services/notificaciones.js';
import { pasoPendiente } from '../models/consentimientosModel.js';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import { useTheme } from '../theme/ThemeContext';
import { FUENTES, RADIO, sombraFlotante } from '../theme/tokens';
import { btnCta, btnSecundario } from '../theme/ui';

const TRADS = { es, ca, en };

function Paso({ numero, titulo, texto, puntos, onAceptar, onAhoraNo, ocupado }) {
  const t = useT(TRADS);
  const { colores } = useTheme();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onAhoraNo} accessibilityViewIsModal>
      <View style={styles.fondo}>
        <View style={[styles.banner, { backgroundColor: colores.papel, borderColor: colores.glassBorder }, sombraFlotante(colores)]}>
          <Text style={[styles.paso, { color: colores.gris }]}>{t('bienvenida.paso', { n: numero, total: 3 })}</Text>
          <Text style={[styles.titulo, { color: colores.tinta }]} accessibilityRole="header">{titulo}</Text>
          <Text style={[styles.p, { color: colores.gris }]}>{texto}</Text>
          {puntos.map((p) => <Text key={p} style={[styles.p, { color: colores.gris }]}>• {p}</Text>)}
          <View style={styles.acciones}>
            <Pressable onPress={onAceptar} disabled={ocupado} accessibilityRole="button">
              <Text style={btnCta(colores, { peq: true, disabled: ocupado })}>{t('bienvenida.aceptar')}</Text>
            </Pressable>
            <Pressable onPress={onAhoraNo} disabled={ocupado} accessibilityRole="button">
              <Text style={btnSecundario(colores, { peq: true })}>{t('bienvenida.ahoraNo')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function PrimerArranque({ usuario }) {
  const t = useT(TRADS);
  const ubicacion = useUbicacion();
  const [cookiesDecididas, setCookiesDecididas] = useState(null);
  const [consentimientos, setConsentimientos] = useState(leerConsentimientos);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vivo = true;
    leerCookies(usuario?.uid).then((c) => vivo && setCookiesDecididas(tieneConsentimiento(c))).catch(() => vivo && setCookiesDecididas(false));
    return () => { vivo = false; };
  }, [usuario]);

  useEffect(() => suscribirConsentimientos(() => setConsentimientos(leerConsentimientos())), []);

  const notificar = useCallback(async () => {
    setOcupado(true);
    try {
      const permiso = await pedirPermisoNotificaciones();
      // Lo que cuenta es lo que el usuario contesta al sistema.
      await decidirConsentimiento('notificaciones', permiso === 'granted' ? 'aceptado' : 'rechazado');
      if (permiso === 'granted' && usuario?.uid) await registrarPush(globalThis.localStorage?.getItem('mira_lang') || 'es');
    } finally { setOcupado(false); }
  }, [usuario?.uid]);

  if (cookiesDecididas === null) return null;
  // En la versión web de la app no hay push nativo: el paso no aplica.
  const notificaciones = consentimientos.notificaciones || (Platform.OS === 'web' ? { estado: 'sin-push' } : null);
  const paso = pasoPendiente({ cookiesDecididas, ubicacion: consentimientos.ubicacion, notificaciones });

  if (paso === 'cookies') return <CookieBanner usuario={usuario} onDecidido={() => setCookiesDecididas(true)} />;
  if (paso === 'ubicacion') {
    return (
      <Paso
        numero={2} ocupado={ocupado}
        titulo={t('ubicacion.modalTitulo')} texto={t('ubicacion.modalIntro')}
        puntos={[t('ubicacion.puntoUso'), t('ubicacion.puntoRecorrido'), t('ubicacion.puntoAbiertaApp'), t('ubicacion.puntoDesactivar')]}
        onAceptar={ubicacion.aceptar}
        onAhoraNo={ubicacion.rechazar}
      />
    );
  }
  if (paso === 'notificaciones') {
    return (
      <Paso
        numero={3} ocupado={ocupado}
        titulo={t('bienvenida.notifTitulo')} texto={t('bienvenida.notifTexto')}
        puntos={[t('bienvenida.notifPunto1'), t('bienvenida.notifPunto2'), t('bienvenida.notifPunto3')]}
        onAceptar={notificar}
        onAhoraNo={() => decidirConsentimiento('notificaciones', 'rechazado')}
      />
    );
  }
  return null;
}

const styles = StyleSheet.create({
  fondo: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  banner: { borderRadius: RADIO.xl, borderWidth: 1, maxWidth: 600, width: '100%', alignSelf: 'center', paddingVertical: 19.2, paddingHorizontal: 24, marginBottom: 8, gap: 6 },
  paso: { fontSize: 12, fontFamily: FUENTES.textoBold, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  titulo: { fontFamily: FUENTES.display, fontWeight: '700', fontSize: 18.4, marginBottom: 4 },
  p: { fontSize: 14.08, fontFamily: FUENTES.texto, lineHeight: 21 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
});
