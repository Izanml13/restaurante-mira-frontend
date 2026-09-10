/**
 * Model — reservas con cupo atómico por hora (sin backend propio).
 * Colección `reservas`: uid, email, restaurantId, nombreRestaurante, ciudad, zona,
 *   fecha (YYYY-MM-DD), hora (HH:MM), comensales, comentarios, estado, createdAt/updatedAt.
 * Aforo: doc `aforo/{restaurantId}_{fecha}_{hora}` con { ocupadas, limite }.
 * Costes: disponibilidad = 1 lectura; crear/cancelar = 1 lectura + 2 escrituras.
 */
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { getDb } from './firebase.js';

/** Franjas fijas de reserva (1 hora). */
export const SLOTS = ['13:00', '14:00', '15:00', '20:00', '21:00', '22:00'];

/**
 * Aforo por hora según reseñas REALES de Yelp (ambiente).
 * Si el doc del restaurante trae maxReservasPorHora, ese valor manda.
 */
export function limitePorResenas(totalResenasYelp) {
  const n = Number(totalResenasYelp) || 0;
  if (n < 100) return 4;
  if (n < 500) return 6;
  if (n < 1000) return 8;
  if (n < 2000) return 10;
  return 12;
}

export function limiteDelLocal(restaurante) {
  const propio = Number(restaurante?.maxReservasPorHora);
  if (Number.isInteger(propio) && propio > 0) return propio;
  return limitePorResenas(restaurante?.totalResenasYelp);
}

export function aforoId(restaurantId, fecha, hora) {
  return `${restaurantId}_${fecha}_${hora}`;
}

function hoyISO() {
  const h = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${h.getFullYear()}-${p(h.getMonth() + 1)}-${p(h.getDate())}`;
}

function validarReserva({ fecha, hora, comensales, comentarios }) {
  if (!fecha || fecha < hoyISO()) throw new Error('La fecha debe ser hoy o futura (YYYY-MM-DD).');
  if (!SLOTS.includes(hora)) throw new Error('Hora no válida: elige una de las franjas.');
  const n = Number(comensales);
  if (!Number.isInteger(n) || n < 1 || n > 10) throw new Error('Comensales: entre 1 y 10.');
  if ((comentarios || '').length > 500) throw new Error('Comentarios: máximo 500 caracteres.');
}

/**
 * Plazas libres de un slot. 1 sola lectura (doc de aforo).
 * @returns {Promise<{ limite:number, ocupadas:number, libres:number }>}
 */
export async function getDisponibilidad(restaurante, fecha, hora) {
  const limite = limiteDelLocal(restaurante);
  if (!fecha || !hora) return { limite, ocupadas: 0, libres: limite };
  const snap = await getDoc(doc(getDb(), 'aforo', aforoId(String(restaurante.id), fecha, hora)));
  const ocupadas = snap.exists() ? Number(snap.data().ocupadas) || 0 : 0;
  return { limite, ocupadas, libres: Math.max(0, limite - ocupadas) };
}

/**
 * Crea la reserva y descuenta plaza en UNA transacción (sin overbooking).
 * @returns {Promise<{ id, codigo, restauranteNombre, fecha, hora, comensales }>}
 */
export async function crearReserva({ restaurante, usuario, fecha, hora, comensales, comentarios = '' }) {
  if (!usuario?.uid) throw new Error('Debes iniciar sesión para reservar.');
  validarReserva({ fecha, hora, comensales, comentarios });
  const restaurantId = String(restaurante.id);
  const limite = limiteDelLocal(restaurante);
  const codigo = `MIRA-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  // ID conocido de antemano para devolverlo en la confirmación.
  const nuevaRef = doc(collection(getDb(), 'reservas'));

  await runTransaction(getDb(), async (tx) => {
    const aforoRef = doc(getDb(), 'aforo', aforoId(restaurantId, fecha, hora));
    const aforoSnap = await tx.get(aforoRef);
    const ocupadas = aforoSnap.exists() ? Number(aforoSnap.data().ocupadas) || 0 : 0;
    if (ocupadas >= limite) throw new Error('Completo a esa hora. Prueba otra franja.');
    // OJO: Transaction.set exige DocumentReference (con auto-id), no CollectionReference.
    tx.set(
      nuevaRef,
      {
        uid: usuario.uid,
        email: usuario.email ?? '',
        restaurantId,
        nombreRestaurante: restaurante.nombre ?? '',
        ciudad: restaurante.ciudad ?? '',
        zona: restaurante.zona ?? '',
        fecha,
        hora,
        comensales: Number(comensales),
        comentarios: (comentarios || '').trim(),
        estado: 'activa',
        codigo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    );
    tx.set(aforoRef, { ocupadas: ocupadas + 1, limite }, { merge: true });
  });

  return { id: nuevaRef.id, codigo, restauranteNombre: restaurante.nombre, fecha, hora, comensales: Number(comensales) };
}

/** Mis reservas (1 query por uid, orden en cliente para no exigir índice compuesto). */
export async function listarMisReservas(uid) {
  const snap = await getDocs(query(collection(getDb(), 'reservas'), where('uid', '==', uid)));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
  return list;
}

/**
 * Cancela (pasa a 'cancelada', nunca se borra) y libera la plaza.
 * Solo el dueño o un admin (lo refuerzan las reglas).
 */
export async function cancelarReserva(reservaId, { uid, esAdmin = false } = {}) {
  // OJO Firestore: en una transacción TODAS las lecturas van antes que las escrituras.
  // Y leer un doc inexistente con reglas por dueño da permission-denied: se traduce.
  try {
    await runTransaction(getDb(), async (tx) => {
      const ref = doc(getDb(), 'reservas', reservaId);
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('La reserva ya no existe.');
      const r = snap.data();
      if (r.estado === 'cancelada') throw new Error('Ya estaba cancelada.');
      if (!esAdmin && r.uid !== uid) throw new Error('Solo puedes cancelar tus reservas.');
      const aforoRef = doc(getDb(), 'aforo', aforoId(r.restaurantId, r.fecha, r.hora));
      const aforoSnap = await tx.get(aforoRef);
      const ocupadas = aforoSnap.exists() ? Number(aforoSnap.data().ocupadas) || 0 : 0;
      tx.update(ref, { estado: 'cancelada', updatedAt: serverTimestamp() });
      tx.set(aforoRef, { ocupadas: Math.max(0, ocupadas - 1) }, { merge: true });
    });
  } catch (e) {
    if (e.code === 'permission-denied') {
      throw new Error('No se puede cancelar: no existe, no es tuya o faltan reglas.');
    }
    throw e;
  }
}
