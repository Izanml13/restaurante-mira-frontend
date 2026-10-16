/**
 * Avisos de ofertas con la app cerrada (G06, segundo plano). Opt-in aparte
 * del consentimiento de G03: pide «Permitir siempre» y Android muestra una
 * notificación fija mientras está activo. Misma lógica que el primer plano
 * (avisosOfertasModel); la posición no se guarda, solo "restaurante:nivel".
 *
 * Este módulo define la tarea al importarse: se importa en el layout raíz.
 */
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLAVE_UBICACION, VERSION_CONSENTIMIENTO } from '../models/ubicacionModel.js';
import { debeConsultar, soloAvisables, CLAVE_FAVS_AVISOS } from '../models/avisosOfertasModel.js';
import { ofertasCerca, registrarAviso } from './ofertasCercaApi.js';
import { seleccionarAvisos } from './sesionesAvisos.js';
import { notificarLocal } from './notificaciones.js';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';

export const TAREA = 'mira-avisos-fondo';
const CLAVE_FONDO = 'mira:ubicacionFondo';
let ultimaConsulta = null; // posición efímera, nunca persistida
const TEXTOS = { es, ca, en };

async function leerJSON(clave) {
  try { return JSON.parse((await AsyncStorage.getItem(clave)) || 'null'); } catch { return null; }
}

async function consentimientoAceptado() {
  const d = await leerJSON(CLAVE_UBICACION);
  return d?.estado === 'aceptado' && d?.version === VERSION_CONSENTIMIENTO;
}

async function procesar(coords) {
  // Con la app abierta ya avisa useAvisosOfertas: aquí no se duplica.
  if (AppState.currentState === 'active') return;
  if (!(await consentimientoAceptado()) || !(await leerJSON(CLAVE_FONDO))?.activo) return;

  const posicion = { lat: coords.latitude, lng: coords.longitude };
  if (!debeConsultar(ultimaConsulta, posicion)) return;
  ultimaConsulta = { ...posicion, t: Date.now() };

  const resultados = await ofertasCerca(posicion);
  const favoritos = (await leerJSON(CLAVE_FAVS_AVISOS)) || [];
  const nuevos = await seleccionarAvisos(soloAvisables(resultados, favoritos), Infinity,
    () => AppState.currentState !== 'active');
  if (!nuevos.length || !(await consentimientoAceptado())) return;

  const lang = (await AsyncStorage.getItem('mira_lang')) || 'es';
  const oc = (TEXTOS[lang] || es).ofertasCerca;
  for (const n of nuevos) {
    registrarAviso(n.oferta.id, n.nivel.distancia).catch(() => {});
    const llegada = n.nivel.distancia === 20;
    await notificarLocal({
      titulo: `${llegada ? '📍' : '🎯'} ${n.restaurante.nombre}`,
      cuerpo: `${n.nivel.texto} · ${llegada ? oc.llegada : oc.aDistancia.replace('{{m}}', n.distanciaM)}`,
      data: { restauranteId: String(n.restaurante.id), llegada: llegada ? '1' : '' },
    });
  }
}

TaskManager.defineTask(TAREA, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  try {
    await procesar(data.locations[data.locations.length - 1].coords);
  } catch {
    /* sin red o 429: se reintenta en la siguiente posición */
  }
});

export async function fondoActivo() {
  try {
    return Boolean((await leerJSON(CLAVE_FONDO))?.activo) && (await Location.hasStartedLocationUpdatesAsync(TAREA));
  } catch {
    return false;
  }
}

/** Pide «Permitir siempre» y arranca. Devuelve 'activo' | 'denegado' | 'error'. */
export async function activarFondo(textos) {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return 'denegado';
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') return 'denegado';
    await Location.startLocationUpdatesAsync(TAREA, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 50,
      timeInterval: 60_000,
      deferredUpdatesInterval: 30_000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: textos.titulo,
        notificationBody: textos.cuerpo,
        notificationColor: '#002218',
        killServiceOnDestroy: false,
      },
    });
    await AsyncStorage.setItem(CLAVE_FONDO, JSON.stringify({ activo: true, fecha: new Date().toISOString() }));
    return 'activo';
  } catch (e) {
    console.warn('[MIRA ubicación] Segundo plano:', e?.message || e);
    return 'error';
  }
}

export async function desactivarFondo() {
  try {
    await AsyncStorage.setItem(CLAVE_FONDO, JSON.stringify({ activo: false, fecha: new Date().toISOString() }));
    if (await Location.hasStartedLocationUpdatesAsync(TAREA)) await Location.stopLocationUpdatesAsync(TAREA);
  } catch {
    /* ya estaba parado */
  }
}
