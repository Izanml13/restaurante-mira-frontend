/**
 * Buscador de la portada en móvil: campo redondo + botón de filtros (con el
 * número de filtros activos) + chips de cocina en horizontal. Los filtros
 * completos se abren en una hoja inferior con "Ver N resultados".
 */
import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import { useTheme } from '../theme/ThemeContext';
import { FUENTES, RADIO } from '../theme/tokens';
import { IconoBusqueda, IconoCerrar } from './shell/Iconos';

const TRADS = { es, ca, en };
const CLAVES_FILTRO = ['precio', 'cocina', 'zona', 'distanciaMax', 'dia', 'franja', 'hora'];

function IconoFiltros({ color }) {
  // Tres líneas con tiradores (ajustes)
  return (
    <View style={{ width: 20, height: 16, justifyContent: 'space-between' }}>
      {[6, 12, 4].map((x, i) => (
        <View key={i} style={{ height: 2, backgroundColor: color, borderRadius: 1 }}>
          <View style={{ position: 'absolute', left: x, top: -3, width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: color, backgroundColor: 'transparent' }} />
        </View>
      ))}
    </View>
  );
}

export default function BuscadorMovil({ filtros, opciones, hayFiltrosActivos, onChange, onClear, total, selects }) {
  const t = useT(TRADS);
  const { colores } = useTheme();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState(filtros.q);
  const [hoja, setHoja] = useState(false);

  useEffect(() => setQ(filtros.q), [filtros.q]);

  const activos = CLAVES_FILTRO.filter((k) => filtros[k]).length;
  const cocinas = opciones.cocinas.slice(0, 12);

  return (
    <View style={styles.raiz}>
      <View style={styles.fila}>
        <View style={[styles.campo, { backgroundColor: colores.papel, borderColor: colores.borde }]}>
          <IconoBusqueda size={18} color={colores.gris} />
          <TextInput
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => q !== filtros.q && onChange('q', q)}
            onBlur={() => q !== filtros.q && onChange('q', q)}
            placeholder={t('busqueda.placeholder')}
            placeholderTextColor={colores.textoSec}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.input, { color: colores.tinta }]}
            accessibilityLabel={t('busqueda.placeholder')}
          />
          {q ? (
            <Pressable onPress={() => { setQ(''); onChange('q', ''); }} hitSlop={10} accessibilityLabel={t('busqueda.limpiar')}>
              <IconoCerrar size={18} color={colores.gris} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setHoja(true)}
          accessibilityRole="button"
          accessibilityLabel={`${t('movil.filtros')}${activos ? ` (${activos})` : ''}`}
          style={({ pressed }) => [
            styles.btnFiltros,
            { backgroundColor: activos ? colores.primaryContainer : colores.papel, borderColor: activos ? colores.primaryContainer : colores.borde },
            pressed && { opacity: 0.8 },
          ]}
        >
          <IconoFiltros color={activos ? '#fff' : colores.tinta} />
          {activos > 0 && (
            <View style={[styles.insignia, { backgroundColor: colores.secondaryContainer }]}>
              <Text style={[styles.insigniaTxt, { color: colores.primary }]}>{activos}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {cocinas.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {['', ...cocinas].map((c) => {
            const activo = (filtros.cocina || '') === c;
            return (
              <Pressable
                key={c || 'todas'}
                onPress={() => onChange('cocina', c)}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                style={({ pressed }) => [
                  styles.chip,
                  { borderColor: activo ? colores.primaryContainer : colores.borde, backgroundColor: activo ? colores.primaryContainer : colores.papel },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.chipTxt, { color: activo ? '#fff' : colores.tinta }]}>{c || t('movil.todas')}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={hoja} transparent animationType="slide" onRequestClose={() => setHoja(false)} statusBarTranslucent>
        <Pressable style={styles.velo} onPress={() => setHoja(false)} accessibilityLabel={t('nav.cerrarMenu')} />
        <View style={[styles.hoja, { backgroundColor: colores.papel, paddingBottom: insets.bottom + 12 }]}>
          <View style={[styles.asa, { backgroundColor: colores.borde }]} />
          <View style={styles.hojaCab}>
            <Text style={[styles.hojaTitulo, { color: colores.tinta }]}>{t('movil.filtros')}</Text>
            <Pressable onPress={onClear} disabled={!hayFiltrosActivos} hitSlop={8}>
              <Text style={[styles.limpiar, { color: hayFiltrosActivos ? colores.primaryContainer : colores.textoSec }]}>{t('busqueda.limpiar')}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.hojaCuerpo} keyboardShouldPersistTaps="handled">
            {selects}
          </ScrollView>
          <Pressable
            onPress={() => setHoja(false)}
            style={({ pressed }) => [styles.verBtn, { backgroundColor: colores.primaryContainer }, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
          >
            <Text style={styles.verTxt}>{t('movil.verResultados', { n: total })}</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: 12 },
  fila: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  campo: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  input: { flex: 1, fontFamily: FUENTES.texto, fontSize: 16, height: '100%' },
  btnFiltros: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  insignia: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  insigniaTxt: { fontFamily: FUENTES.textoBold, fontSize: 11 },
  chips: { gap: 8, paddingRight: 16 },
  chip: { height: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' },
  chipTxt: { fontFamily: FUENTES.textoSemi, fontSize: 14 },
  velo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  hoja: { borderTopLeftRadius: RADIO.xl, borderTopRightRadius: RADIO.xl, maxHeight: '88%' },
  asa: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: 8 },
  hojaCab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  hojaTitulo: { fontFamily: FUENTES.display, fontSize: 22 },
  limpiar: { fontFamily: FUENTES.textoBold, fontSize: 15 },
  hojaCuerpo: { paddingHorizontal: 20, gap: 14, paddingBottom: 12 },
  verBtn: { marginHorizontal: 20, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  verTxt: { color: '#fff', fontFamily: FUENTES.textoBold, fontSize: 16 },
});
