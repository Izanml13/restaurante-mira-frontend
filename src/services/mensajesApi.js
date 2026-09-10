/**
 * Model — mensajería interna (`mensajes`). Los escribe el script
 * recordatorios.js con Admin SDK; la web solo lee y marca leídos.
 * Costes: 1 query al abrir el buzón; badge = misma query (sin realtime).
 */
import { collection, getDocs, doc, query, where, updateDoc } from 'firebase/firestore';
import { getDb } from './firebase.js';

/** Mensajes del usuario, recientes primero (orden en cliente, sin índice). */
export async function listarMensajes(uid) {
  const snap = await getDocs(query(collection(getDb(), 'mensajes'), where('uid', '==', uid)));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (b.creado?.seconds ?? 0) - (a.creado?.seconds ?? 0));
  return list;
}

/** Nº sin leer (reutiliza una sola query). */
export async function contarNoLeidos(uid) {
  const snap = await getDocs(query(collection(getDb(), 'mensajes'), where('uid', '==', uid)));
  let n = 0;
  snap.forEach((d) => {
    if (d.data().leido !== true) n++;
  });
  return n;
}

/** Marcar como leído (solo el dueño, lo refuerzan las reglas). */
export async function marcarLeido(id) {
  await updateDoc(doc(getDb(), 'mensajes', id), { leido: true });
}
