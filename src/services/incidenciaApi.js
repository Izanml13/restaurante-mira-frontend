/**
 * Model — incidencias sobre la colección `contactos`.
 * Al enviar logueado se guarda uid/email/estado 'pendiente'.
 * El cliente ve las suyas; el admin (allowlist `admins/{uid}`) ve pendientes y resuelve.
 * Costes: todo son queries pequeñas o escrituras unitarias, nada de full-scans.
 */
import { collection, addDoc, getDocs, getDoc, doc, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from './firebase.js';

/** ¿Es admin? Revisa `usuarios/{uid}.tipo` y la colección `admins/{uid}`. */
export async function esAdmin(uid) {
  if (!uid) return false;
  try {
    const [userSnap, adminSnap] = await Promise.all([
      getDoc(doc(getDb(), 'usuarios', uid)),
      getDoc(doc(getDb(), 'admins', uid)),
    ]);
    if (userSnap.exists() && userSnap.data().tipo === 'admin') return true;
    if (adminSnap.exists()) {
      const data = adminSnap.data();
      return data.rol === 'admin' || data.tipo === 'admin' || true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Mis incidencias: por uid. */
export async function listarMisIncidencias({ uid }) {
  if (!uid) return [];
  const snap = await getDocs(query(collection(getDb(), 'contactos'), where('uid', '==', uid)));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
