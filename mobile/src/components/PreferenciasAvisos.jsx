/**
 * Mi cuenta → «Notificaciones» en la app (T10): qué avisos push recibir.
 * GET/PUT /v1/push/preferencias; afecta a todos los dispositivos del usuario.
 * Si la API no lo tiene (o falla), la sección no se muestra.
 */
import { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { api } from '../services/httpClient.js';
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

  useEffect(() => {
    let vivo = true;
    api.get('/v1/push/preferencias').then((p) => vivo && setPrefs(p)).catch(() => {});
    return () => { vivo = false; };
  }, []);

  if (!prefs) return null;

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
        {error ? <Text style={[styles.intro, { color: colores.rojo }]} accessibilityRole="alert">{error}</Text> : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 2 },
  intro: { fontFamily: FUENTES.texto, fontSize: 14.5, marginBottom: 6 },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth },
  txt: { fontFamily: FUENTES.textoSemi, fontSize: 16 },
});
