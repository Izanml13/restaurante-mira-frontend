/**
 * Reseñas — colección 'resenas' en Firestore.
 * Campos: restauranteId, usuarioId, usuarioNombre, puntuacion (1-5), comentario, likes, likedBy (array uid), createdAt
 */
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, arrayUnion, arrayRemove, increment, serverTimestamp } from 'firebase/firestore';
import { getDb } from './firebase.js';

export async function crearResena({ restauranteId, usuario, puntuacion, comentario }){
  if (!usuario?.uid) throw new Error('Debes iniciar sesión para reseñar.');
  if (!puntuacion || puntuacion<1 || puntuacion>5) throw new Error('Puntuación 1-5.');
  if (!comentario?.trim()) throw new Error('Escribe un comentario.');
  const ref = await addDoc(collection(getDb(),'resenas'), {
    restauranteId: String(restauranteId),
    usuarioId: usuario.uid,
    usuarioNombre: usuario.nombre || usuario.email,
    puntuacion: Number(puntuacion),
    comentario: comentario.trim(),
    likes: 0,
    likedBy: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listarResenasDeRestaurante(restauranteId){
  const snap = await getDocs(query(collection(getDb(),'resenas'), where('restauranteId','==', String(restauranteId))));
  const list = snap.docs.map(d=> ({ id:d.id, ...d.data() }));
  // ordenar populares primero (likes desc, luego puntuación)
  list.sort((a,b)=> (b.likes||0)-(a.likes||0) || (b.puntuacion||0)-(a.puntuacion||0));
  return list;
}

export async function listarResenasDeUsuario(usuarioId){
  const snap = await getDocs(query(collection(getDb(),'resenas'), where('usuarioId','==', usuarioId)));
  const list = snap.docs.map(d=> ({ id:d.id, ...d.data() }));
  list.sort((a,b)=> {
    const ta = b.createdAt?.seconds || 0;
    const tb = a.createdAt?.seconds || 0;
    return ta - tb;
  });
  return list;
}

export async function darLikeResena(resenaId, usuarioId){
  const ref = doc(getDb(),'resenas', resenaId);
  await updateDoc(ref, { likes: increment(1), likedBy: arrayUnion(usuarioId) });
}
export async function quitarLikeResena(resenaId, usuarioId){
  const ref = doc(getDb(),'resenas', resenaId);
  await updateDoc(ref, { likes: increment(-1), likedBy: arrayRemove(usuarioId) });
}
