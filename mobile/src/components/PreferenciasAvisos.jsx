/**
 * Mi cuenta → «Notificaciones» en la app.
 * - Estado (C02): consentimiento + permiso real del móvil, con la acción que toca
 *   (activar, dar permiso, abrir ajustes o desactivar). Siempre visible.
 * - Qué avisos recibir (T10): GET/PUT /v1/push/preferencias, solo con sesión;
 *   si la API no lo tiene (o falla), los interruptores no se muestran.
 */
import { useCallback, useEffect, useState } from 'react';
import { View, Text, Switch, Pressable, StyleSheet, AppState, Linking, Platform } from 'react-native';
import { api } from '../services/httpClient.js';
import { consultarPermisoNotificaciones, pedirPermisoNotificaciones, registrarPush, borrarPush } from '../services/notificaciones.js';
import { leerConsentimientos, decidirConsentimiento, suscribirConsentimientos } from '../services/consentimientosApi.js';
import { estadoNotificaciones } from '../models/notificacionesModel.js';
import { alVolverAPrimerPlano } from '../services/primerPlano.js';
import { btnCta, btnSecundario } from '../theme/ui';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import { useTheme } from '../theme/ThemeContext';
import { FUENTES } from '../theme/tokens';

const TRADS = { es, ca, en };
const CATEGORIAS = ['reservas', 'mensajes', 'promociones'];

export default function PreferenciasAvisos({ Sub }) {
  const t = useT(TRADS);
  const { colores } = useTheme();
  const [prefs, setPrefs] = useState(null);
  const [error, setError] = useState('');
  const [consentimiento, setConsentimiento] = useState(() => leerConsentimientos().notificaciones);
  const [permiso, setPermiso] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vivo = true;
    api.get('/v1/push/preferencias').then((p) => vivo && setPrefs(p)).catch(() => {});
    return () => { vivo = false; };
  }, []);

  // Permiso real del sistema: al entrar y al volver de Ajustes (solo consulta, nunca pide).
  const reconsultar = useCallback(() => {
    consultarPermisoNotificaciones().then(setPermiso).catch(() => setPermiso(null));
  }, []);
  useEffect(() => { reconsultar(); return alVolverAPrimerPlano(AppState, reconsultar); }, [reconsultar]);
  useEffect(() => suscribirConsentimientos(() => setConsentimiento(leerConsentimientos().notificaciones)), []);

  const estado = estadoNotificaciones(consentimiento, permiso);
  const lang = () => globalThis.localStorage?.getItem('mira_lang') || 'es';

  async function activar() {
    setOcupado(true); setError('');
    try {
      const r = await pedirPermisoNotificaciones();
      await decidirConsentimiento('notificaciones', r === 'granted' ? 'aceptado' : 'rechazado');
      if (r === 'granted') await registrarPush(lang());
      reconsultar();
    } catch { setError(t('avisos.error')); } finally { setOcupado(false); }
  }

  async function desactivar() {
    setOcupado(true); setError('');
    try {
      await decidirConsentimiento('notificaciones', 'rechazado');
      await borrarPush();
    } finally { setOcupado(false); }
  }

  const accion = {
    desactivadas: { texto: t('avisos.activar'), onPress: activar, cta: true },
    faltaPermiso: { texto: t('ubicacion.darPermiso'), onPress: activar, cta: true },
    bloqueado: { texto: t('ubicacion.abrirAjustes'), onPress: () => Linking.openSettings().catch(() => {}), cta: true },
    activas: { texto: t('avisos.desactivar'), onPress: desactivar, cta: false },
  }[estado];

  async function cambiar(cat, valor) {
    const antes = prefs;
    setPrefs({ ...prefs, [cat]: valor });
    setError('');
    try {
      setPrefs(await api.put('/v1/push/preferencias', { [cat]: valor }));
    } catch {
      setPrefs(antes);
      setError(t('avisos.error'));
    }
  }

  return (
    <>
      <Sub>{t('avisos.titulo')}</Sub>
      {Platform.OS !== 'web' ? (
        <View style={styles.estado}>
          <Text style={[styles.txt, { color: colores.tinta }]} accessibilityLiveRegion="polite">{t(`avisos.estadoMovil.${estado}`)}</Text>
          <Pressable onPress={accion.onPress} disabled={ocupado} accessibilityRole="button" style={({ pressed }) => [{ alignSelf: 'flex-start', opacity: pressed || ocupado ? 0.7 : 1 }]}>
            <Text style={[accion.cta ? btnCta(colores, { peq: true }) : btnSecundario(colores, { peq: true }), { marginTop: 0 }]}>{accion.texto}</Text>
          </Pressable>
        </View>
      ) : null}
      {prefs ? (
      <View style={styles.lista}>
        <Text style={[styles.intro, { color: colores.gris }]}>{t('avisos.queRecibir')}</Text>
        {CATEGORIAS.map((cat) => (
          <View key={cat} style={[styles.fila, { borderBottomColor: colores.borde }]}>
            <Text style={[styles.txt, { color: colores.tinta }]}>{t(`avisos.categoria.${cat}`)}</Text>
            <Switch
              value={prefs[cat] !== false}
              onValueChange={(v) => cambiar(cat, v)}
              trackColor={{ true: colores.primaryContainer, false: colores.borde }}
              thumbColor="#fff"
              accessibilityLabel={t(`avisos.categoria.${cat}`)}
            />
          </View>
        ))}
      </View>
      ) : null}
      {error ? <Text style={[styles.intro, { color: colores.rojo }]} accessibilityRole="alert">{error}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 2 },
  estado: { gap: 10, marginBottom: 12 },
  intro: { fontFamily: FUENTES.texto, fontSize: 14.5, marginBottom: 6 },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth },
  txt: { fontFamily: FUENTES.textoSemi, fontSize: 16 },
});
