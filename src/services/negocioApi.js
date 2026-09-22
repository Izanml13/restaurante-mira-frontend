/**
 * Model — locales propuestos por cuentas empresa (`negocios`).
 * Flujo: empresa propone (estado pendiente) → admin aprueba (copia a
 * `restaurants`) o rechaza. 1-2 escrituras por acción, queries pequeñas.
 */
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from './firebase.js';

const PRECIOS = ['€', '€€', '€€€'];

function validarPropuesta(d) {
  if (!d.nombre?.trim()) throw new Error('El nombre es obligatorio.');
  if (!d.ciudad?.trim()) throw new Error('La ciudad es obligatoria.');
  if (!d.zona) throw new Error('Elige la zona.');
  if (!d.direccion?.trim()) throw new Error('La dirección es obligatoria.');
  if (!PRECIOS.includes(d.precio)) throw new Error('Precio no válido.');
  if (!Array.isArray(d.categorias) || !d.categorias.length) {
    throw new Error('Indica al menos una cocina (separadas por comas).');
  }
}

/** Empresa propone su local (queda pendiente de revisión). */
export async function proponerNegocio({ usuario, datos }) {
  if (!usuario?.uid) throw new Error('Debes iniciar sesión para proponer tu local.');
  validarPropuesta(datos);
  const ref = await addDoc(collection(getDb(), 'negocios'), {
    uid: usuario.uid,
    email: usuario.email ?? '',
    estado: 'pendiente',
    nombre: datos.nombre.trim(),
    ciudad: datos.ciudad.trim(),
    zona: datos.zona,
    direccion: datos.direccion.trim(),
    telefono: (datos.telefono || '').trim(),
    categorias: datos.categorias,
    precio: datos.precio,
    descripcion: (datos.descripcion || '').trim(),
    imagen_url: (datos.imagen_url || '').trim(),
    accesoDiscapacidad: datos.accesoDiscapacidad ?? null,
    menuInfantil: datos.menuInfantil ?? null,
    entornoTranquilo: datos.entornoTranquilo ?? null,
    tronas: datos.tronas ?? null,
    terraza: datos.terraza ?? null,
    alergenos: (datos.alergenos || '').trim(),
    creado: serverTimestamp(),
  });
  return ref.id;
}

/** Locales propuestos por un usuario (para "Mi negocio"). */
export async function listarMisNegocios(uid) {
  const snap = await getDocs(query(collection(getDb(), 'negocios'), where('uid', '==', uid)));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (b.creado?.seconds ?? 0) - (a.creado?.seconds ?? 0));
  return list;
}

/** Cola de pendientes para el admin (1 query). */
export async function listarNegociosPendientes() {
  const snap = await getDocs(query(collection(getDb(), 'negocios'), where('estado', '==', 'pendiente')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Aprueba: copia a `restaurants` (id auto) y marca aprobada. Atómico (batch).
 * El local nuevo empieza sin nota ni reseñas: las ganará con los clientes.
 */
export async function aprobarNegocio(negocioId) {
  const db = getDb();
  const ref = doc(db, 'negocios', negocioId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('La propuesta ya no existe.');
  const n = snap.data();
  if (n.estado === 'aprobada') throw new Error('Ya estaba aprobada.');
  const batch = writeBatch(db);
  const restRef = doc(collection(db, 'restaurants'));
  batch.set(restRef, {
    nombre: n.nombre,
    categorias: n.categorias,
    precio: n.precio,
    ciudad: n.ciudad,
    zona_busqueda: n.zona,
    direccion_completa: n.direccion,
    telefono: n.telefono || '',
    descripcion: n.descripcion || '',
    imagen_url: n.imagen_url || '',
    rating_yelp: null,
    total_resenas_yelp: 0,
    accesoDiscapacidad: n.accesoDiscapacidad ?? null,
    menuInfantil: n.menuInfantil ?? null,
    entornoTranquilo: n.entornoTranquilo ?? null,
    tronas: n.tronas ?? null,
    terraza: n.terraza ?? null,
    alergenos: n.alergenos || '',
    resenas: [],
    uid: n.uid,
    email: n.email || '',
    activo: true,
    comisionPct: 10,
    creado: serverTimestamp(),
  });
  const userRef = doc(db, 'usuarios', n.uid);
  const userSnap = await getDoc(userRef).catch(() => null);
  const userData = userSnap && userSnap.exists() ? userSnap.data() : {};
  const restaurantIds = Array.isArray(userData.restaurantIds) ? [...userData.restaurantIds] : [];
  if (userData.restaurantId && !restaurantIds.includes(userData.restaurantId)) restaurantIds.push(userData.restaurantId);
  if (!restaurantIds.includes(restRef.id)) restaurantIds.push(restRef.id);
  const userUpdate = { tipo: 'empresa', restaurantIds };
  // Keep first restaurant as active; only set restaurantId if user has none yet
  if (!userData.restaurantId) userUpdate.restaurantId = restRef.id;
  batch.update(userRef, userUpdate);
  batch.update(ref, { estado: 'aprobada', restaurantId: restRef.id });
  await batch.commit();
  return restRef.id;
}

/** Rechaza la propuesta (no se borra: queda historial). */
export async function rechazarNegocio(negocioId) {
  await updateDoc(doc(getDb(), 'negocios', negocioId), { estado: 'rechazada' });
}
