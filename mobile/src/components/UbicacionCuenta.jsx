/**
 * Sección de «Mi cuenta» (app): estado de la ubicación para ofertas cercanas (G03).
 * C02: «Activar» lanza directamente el permiso del sistema (la explicación RGPD
 * se dio en el primer arranque y está en el texto). Si falta el permiso, «Dar
 * permiso»; si el sistema ya no deja preguntar, «Abrir ajustes».
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import useUbicacion from '../hooks/useUbicacion.js';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import { useTheme } from '../theme/ThemeContext';
import { FUENTES } from '../theme/tokens';
import { btnCta, btnSecundario } from '../theme/ui';

const TRADS = { es, ca, en };

function Boton({ estilo, texto, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [{ alignSelf: 'flex-start', opacity: pressed ? 0.75 : 1 }]}>
      <Text style={[estilo, { marginTop: 0 }]}>{texto}</Text>
    </Pressable>
  );
}

export default function UbicacionCuenta() {
  const t = useT(TRADS);
  const { colores } = useTheme();
  const { consentimiento, activa, posicion, error, aceptar, rechazar, pedirPermiso, abrirAjustes } = useUbicacion();
  const texto = [styles.texto, { color: colores.gris }];

  return (
    <View style={styles.form}>
      <Text style={texto}>{t('ubicacion.descripcion')} {t('ubicacion.puntoRecorrido')}</Text>
      <Text style={[styles.estado, { color: colores.tinta }]} accessibilityLiveRegion="polite">
        {t(activa ? 'ubicacion.estadoActiva' : 'ubicacion.estadoInactiva')}
      </Text>
      {activa && !error && !posicion ? <Text style={texto}>{t('ubicacion.buscando')}</Text> : null}
      {activa && error ? <Text style={[styles.texto, { color: colores.rojo || '#b3261e' }]} accessibilityRole="alert">{t(`ubicacion.${error}`)}</Text> : null}
      {activa && error === 'permisoPendiente' ? <Boton estilo={btnCta(colores, { peq: true })} texto={t('ubicacion.darPermiso')} onPress={pedirPermiso} /> : null}
      {activa && error === 'permisoBloqueado' ? <Boton estilo={btnCta(colores, { peq: true })} texto={t('ubicacion.abrirAjustes')} onPress={abrirAjustes} /> : null}
      {activa && posicion ? (
        <Text style={texto}>
          {t('ubicacion.posicionActual', { lat: posicion.lat, lng: posicion.lng })}
          {posicion.precisionM != null ? ` · ${t('ubicacion.precision', { m: posicion.precisionM })}` : ''}
          {'\n'}{t('ubicacion.noSeEnviaApp')}
        </Text>
      ) : null}
      {activa
        ? <Boton estilo={btnSecundario(colores, { peq: true })} texto={t('ubicacion.desactivar')} onPress={rechazar} />
        : <Boton estilo={btnCta(colores, { peq: true })} texto={t('ubicacion.activar')} onPress={aceptar} />}
      {consentimiento.estado === 'rechazado' ? <Text style={texto}>{t('ubicacion.rechazadaNota')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 11.2, marginBottom: 8 },
  texto: { fontSize: 14.72, fontFamily: FUENTES.texto, lineHeight: 21 },
  estado: { fontSize: 14.72, fontFamily: FUENTES.textoBold, fontWeight: '700' },
});
