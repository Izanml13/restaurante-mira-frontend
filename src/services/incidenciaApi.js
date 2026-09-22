/**
 * Model — incidencias sobre la colección `contactos`.
 * Al enviar logueado se guarda uid/email/estado 'pendiente'.
 * El cliente ve las suyas; el admin (allowlist `admins/{uid}`) ve pendientes y resuelve.
 * Costes: todo son queries pequeñas o escrituras unitarias, nada de full-scans.
 */
import { collection, addDoc, getDocs, getDoc, doc, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from './firebase.js';

/** ¿Es admin? Revisa `usuarios/{uid}.tipo` Y la allowlist `admins/{uid}`.
 * Cada lectura se evalúa por separado: si las reglas deniegan una,
 * la otra sigue valiendo (un solo fallo ya no tumba todo el chequeo). */
export async function esAdmin(uid) {
  if (!uid) return false;
  const [userSnap, adminSnap] = await Promise.allSettled([
    getDoc(doc(getDb(), 'usuarios', uid)),
    getDoc(doc(getDb(), 'admins', uid)),
  ]);
  if (
    userSnap.status === 'fulfilled' &&
    userSnap.value.exists() &&
    userSnap.value.data().tipo === 'admin'
  ) {
    return true;
  }
  if (adminSnap.status === 'fulfilled' && adminSnap.value.exists()) {
    const data = adminSnap.value.data() || {};
    return data.rol === 'admin' || data.tipo === 'admin' || true;
  }
  return false;
}

/** Mis incidencias: por uid y (compat) por email, orden en cliente. */
export async function listarMisIncidencias({ uid, email }) {
  const promesas = [];
  if (uid) promesas.push(getDocs(query(collection(getDb(), 'contactos'), where('uid', '==', uid))));
  if (email) promesas.push(getDocs(query(collection(getDb(), 'contactos'), where('email', '==', email))));
  const snaps = await Promise.all(promesas);
  const vistos = new Set();
  const list = [];
  for (const snap of snaps) {
    for (const d of snap.docs) {
      if (vistos.has(d.id)) continue;
      vistos.add(d.id);
      list.push({ id: d.id, ...d.data() });
    }
  }
  list.sort((a, b) => (b.creado?.seconds ?? 0) - (a.creado?.seconds ?? 0));
  return list;
}

/** Cola de pendientes para el admin (1 query). */
export async function listarPendientes() {
  const snap = await getDocs(query(collection(getDb(), 'contactos'), where('estado', '==', 'pendiente')));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (a.creado?.seconds ?? 0) - (b.creado?.seconds ?? 0));
  return list;
}

/** Marcar resuelta (solo admin, lo refuerzan las reglas). */
export async function resolverIncidencia(id) {
  await updateDoc(doc(getDb(), 'contactos', id), { estado: 'resuelta' });
}
