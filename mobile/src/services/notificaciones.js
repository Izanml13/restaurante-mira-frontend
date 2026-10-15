/**
 * Notificaciones push (Android vía Expo Push / FCM).
 * - registrarPush(lang): pide permiso, crea el canal de Android, saca el token
 *   Expo y lo manda a POST /v1/push/tokens. Devuelve el id del dispositivo.
 * - borrarPush(): DELETE /v1/push/tokens/:id al cerrar sesión.
 * Mientras mira-api no tenga el módulo push (T04), el token sale por consola.
 * Las remotas no van en Expo Go: hace falta un development build.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './httpClient.js';

const LS_DISPOSITIVO = 'mira:pushDispositivo';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function sacarToken() {
  if (!Device.isDevice) {
    console.log('[MIRA push] Emulador o web: sin notificaciones remotas.');
    return null;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'MIRA',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#002218',
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('[MIRA push] Falta extra.eas.projectId en app.json (ejecuta `eas init`).');
    return null;
  }
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

export async function registrarPush(lang = 'es') {
  if (Platform.OS === 'web') return null;
  try {
    const token = await sacarToken();
    if (!token) return null;
    console.log('[MIRA push] Token Expo:', token);
    const r = await api.post('/v1/push/tokens', { token, tipo: 'expo', plataforma: Platform.OS, idioma: lang });
    if (r?.id) await AsyncStorage.setItem(LS_DISPOSITIVO, String(r.id));
    return r?.id ?? null;
  } catch (e) {
    // Sin T04 en el backend esto da 404: no rompe el login.
    console.warn('[MIRA push] No se pudo registrar el token:', e?.message || e);
    return null;
  }
}

export async function borrarPush() {
  try {
    const id = await AsyncStorage.getItem(LS_DISPOSITIVO);
    if (!id) return;
    await AsyncStorage.removeItem(LS_DISPOSITIVO);
    await api.del(`/v1/push/tokens/${encodeURIComponent(id)}`);
  } catch (e) {
    console.warn('[MIRA push] No se pudo borrar el token:', e?.message || e);
  }
}

/** Al tocar una notificación con data.ruta, navega a esa pantalla. */
export function escucharToques(navegar) {
  if (Platform.OS === 'web') return () => {};
  const abrir = (resp) => {
    const data = resp?.notification?.request?.content?.data || {};
    // Avisos de ofertas (G06): abren la ficha del restaurante.
    const rid = String(data.restauranteId || '');
    if (/^[\w-]+$/.test(rid)) { navegar(`/detalle?id=${encodeURIComponent(rid)}`); return; }
    // El backend manda "reservas" o "/reservas".
    const ruta = String(data.ruta || '').replace(/^\/+/, '');
    if (/^[\w/-]+$/.test(ruta)) navegar(`/${ruta}`);
  };
  const ultima = Notifications.getLastNotificationResponse();
  if (ultima) abrir(ultima);
  const sub = Notifications.addNotificationResponseReceivedListener(abrir);
  return () => sub.remove();
}

/** Notificación local inmediata (G06: aviso de oferta cercana con la app abierta). */
export async function notificarLocal({ titulo, cuerpo, data }) {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.scheduleNotificationAsync({ content: { title: titulo, body: cuerpo, data }, trigger: null });
  } catch (e) {
    console.warn('[MIRA push] Notificación local:', e?.message || e);
  }
}
