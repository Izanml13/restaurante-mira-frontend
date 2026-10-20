import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AppShell } from '../components/shell/AppShell';
import { useAuthContext } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { useT, useI18n } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import { enviarTurno, nuevaClaveTurno } from '../services/aiApi.js';
import { MAX_MENSAJE, normalizarRespuesta } from '../services/aiPayload.js';
const TRADS = { es, ca, en };

export default function Mira() {
  const t = useT(TRADS);
  const { lang } = useI18n();
  const { colores } = useTheme();
  const { usuario } = useAuthContext();
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [fallido, setFallido] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const generacion = useRef(0);
  const ctl = useRef(null);
  const lista = useRef(null);

  function parar() {
    generacion.current++;
    ctl.current?.abort();
    ctl.current = null;
    setOcupado(false);
  }
  function limpiar() {
    parar(); setMensajes([]); setTexto(''); setError(''); setFallido(null); setConfirmacion(null);
  }
  useEffect(() => {
    limpiar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { generacion.current++; ctl.current?.abort(); ctl.current = null; };
    // Cada sesión tiene su conversación; nunca conservar la de otra cuenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.uid]);

  async function enviar(turno) {
    if (ctl.current) return;
    const id = ++generacion.current;
    const controller = new AbortController();
    ctl.current = controller;
    setOcupado(true); setError(''); setFallido(null); setConfirmacion(null);
    try {
      const respuesta = normalizarRespuesta(await enviarTurno({ ...turno, signal: controller.signal }));
      if (id !== generacion.current) return;
      const content = [respuesta.reply || t('apk.chat.sinRespuesta'), ...respuesta.errores.map(e => `${t('apk.chat.errorAccion')}: ${e}`)].join('\n');
      setMensajes(m => [...m, { role: 'model', content }]);
      setConfirmacion(respuesta.needsConfirm);
    } catch (err) {
      if (id !== generacion.current) return;
      setError(t(err.status === 429 ? 'apk.chat.limite' : err.status === 401 ? 'apk.chat.sesion' : err.name === 'TimeoutError' ? 'apk.chat.timeout' : 'apk.chat.error'));
      setFallido(turno); // Un reintento conserva cuerpo y clave de idempotencia.
    } finally {
      if (id === generacion.current) { ctl.current = null; setOcupado(false); }
    }
  }
  function preguntar(confirmId) {
    const message = confirmId ? t('apk.chat.confirmar') : texto.trim();
    if (!message || ctl.current) return;
    const turno = { message, history: mensajes, lang, confirmId, idempotencyKey: nuevaClaveTurno() };
    setMensajes(m => [...m, { role: 'user', content: message }]);
    setTexto('');
    enviar(turno);
  }
  return <AppShell scroll={false} ocultarFooter>
    <KeyboardAvoidingView style={{ flex: 1, padding: 16, gap: 12 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text accessibilityRole="header" style={{ fontSize: 24, fontWeight: '700', color: colores.tinta }}>{t('apk.mira')}</Text>
        <Boton colores={colores} label={t('apk.chat.nueva')} onPress={limpiar} />
      </View>
      <ScrollView ref={lista} style={{ flex: 1 }} contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled" onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}>
        {!mensajes.length && <Text style={{ color: colores.gris }}>{t('apk.chat.intro')}</Text>}
        {mensajes.map((m, i) => <View key={i} style={{ padding: 14, borderRadius: 12, backgroundColor: m.role === 'user' ? colores.verdeSuave : colores.papel }}>
          <Text selectable style={{ color: colores.tinta, lineHeight: 23 }}>{m.content}</Text>
        </View>)}
        {ocupado && <Text accessibilityLiveRegion="polite" style={{ color: colores.gris }}>{t('apk.chat.pensando')}</Text>}
        {!!error && <Text accessibilityRole="alert" style={{ color: colores.rojo }}>{error}</Text>}
        {fallido && <Boton colores={colores} label={t('apk.chat.reintentar')} onPress={() => enviar(fallido)} disabled={ocupado} />}
        {confirmacion && <View style={{ gap: 8, padding: 12, borderWidth: 1, borderColor: colores.borde, borderRadius: 12 }}>
          <Text style={{ color: colores.tinta }}>{confirmacion.summary || t('apk.chat.confirmacion')}</Text>
          <Boton colores={colores} label={t('apk.chat.confirmar')} onPress={() => preguntar(confirmacion.confirmId)} disabled={ocupado} />
          <Boton colores={colores} label={t('apk.chat.cancelar')} onPress={() => setConfirmacion(null)} />
        </View>}
      </ScrollView>
      <TextInput accessibilityLabel={t('apk.chat.escribir')} placeholder={t('apk.chat.escribir')} placeholderTextColor={colores.gris} value={texto} onChangeText={setTexto}
        maxLength={MAX_MENSAJE} multiline editable={!ocupado && !confirmacion}
        style={{ color: colores.tinta, backgroundColor: colores.papel, borderColor: colores.borde, borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 48, maxHeight: 120 }} />
      {ocupado ? <Boton colores={colores} label={t('apk.chat.parar')} onPress={parar} /> : <Boton colores={colores} label={t('apk.chat.enviar')} onPress={() => preguntar()} disabled={!texto.trim() || !!confirmacion} />}
    </KeyboardAvoidingView>
  </AppShell>;
}

function Boton({ label, onPress, colores, disabled = false }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={{ minHeight: 48, padding: 12, borderRadius: 12, backgroundColor: colores.verdeSuave, opacity: disabled ? 0.5 : 1, justifyContent: 'center' }}>
    <Text style={{ color: colores.verde, fontWeight: '700' }}>{label}</Text>
  </Pressable>;
}
