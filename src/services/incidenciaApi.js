/**
 * Model — incidencias sobre la colección `contactos`.
 * Al enviar logueado se guarda uid/email/estado 'pendiente'.
 * El cliente ve las suyas; el admin (allowlist `admins/{uid}`) ve pendientes y resuelve.
 * Costes: todo son queries pequeñas o escrituras unitarias, nada de full-scans.
 */
import { collection, addDoc, getDocs, getDoc, doc, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from './firebase.js';

/** ¿Es admin? 1 lectura al doc allowlist `admins/{uid}`. */
export async function esAdmin(uid) {
  if (!uid) return false;
  try {
    const snap = await getDoc(doc(getDb(), 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
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
