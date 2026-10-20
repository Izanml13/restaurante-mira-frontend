/**
 * Mi cuenta → interruptor «Avisar también con la app cerrada» (G06, segundo
 * plano). Solo aparece con la ubicación de G03 activada. Explica qué hace
 * antes de pedir «Permitir siempre».
 */
import { useEffect, useState } from 'react';
import { View, Text, Switch, Platform, StyleSheet } from 'react-native';
import useUbicacion from '../hooks/useUbicacion.js';
import { fondoActivo, activarFondo, desactivarFondo } from '../services/ubicacionFondo.js';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import { useTheme } from '../theme/ThemeContext';
import { FUENTES } from '../theme/tokens';

const TRADS = { es, ca, en };

export default function UbicacionFondo() {
  const t = useT(TRADS);
  const { colores } = useTheme();
  const { activa } = useUbicacion();
  const [encendido, setEncendido] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let vivo = true;
    fondoActivo().then((v) => vivo && setEncendido(v));
    return () => { vivo = false; };
  }, [activa]);

  if (Platform.OS === 'web' || !activa) return null;

  async function cambiar(valor) {
    setOcupado(true);
    setAviso('');
    if (valor) {
      const r = await activarFondo({ titulo: t('fondo.servicioTitulo'), cuerpo: t('fondo.servicioTexto') });
      setEncendido(r === 'activo');
      if (r === 'denegado') setAviso(t('fondo.denegado'));
      if (r === 'error') setAviso(t('fondo.error'));
    } else {
      await desactivarFondo();
      setEncendido(false);
    }
    setOcupado(false);
  }

  return (
    <View style={[styles.caja, { borderColor: colores.borde }]}>
      <View style={styles.fila}>
        <Text style={[styles.titulo, { color: colores.tinta }]}>{t('fondo.titulo')}</Text>
        <Switch
          value={encendido}
          disabled={ocupado}
          onValueChange={cambiar}
          trackColor={{ true: colores.primaryContainer, false: colores.borde }}
          thumbColor="#fff"
          accessibilityLabel={t('fondo.titulo')}
        />
      </View>
      <Text style={[styles.texto, { color: colores.gris }]}>{t('fondo.explicacion')}</Text>
      {aviso ? <Text style={[styles.texto, { color: colores.rojo }]} accessibilityRole="alert">{aviso}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 12, gap: 6 },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  titulo: { flex: 1, fontFamily: FUENTES.textoSemi, fontSize: 16 },
  texto: { fontFamily: FUENTES.texto, fontSize: 14, lineHeight: 20 },
});
