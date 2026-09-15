/**
 * Model — perfil en `usuarios/{uid}`: tipo de cuenta + preferencias + idioma.
 * { tipo: 'cliente'|'empresa', nombre, email, soloVegano:bool, alergias:[],
 *   lang: 'es'|'ca'|'en', creado }. 1 lectura al entrar; 1 escritura al guardar.
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from './firebase.js';
import { detectarIdioma } from '../i18n/index.jsx';

export const PERFIL_VACIO = { tipo: 'cliente', soloVegano: false, alergias: [], lang: detectarIdioma() };

/** Lee el perfil (1 lectura). Si no existe, devuelve valores por defecto. */
export async function obtenerPerfil(uid) {
  if (!uid) return { ...PERFIL_VACIO };
  const snap = await getDoc(doc(getDb(), 'usuarios', uid));
  if (!snap.exists()) return { ...PERFIL_VACIO };
  const d = snap.data();
  const langs = ['es', 'ca', 'en'];
  return {
    tipo: d.tipo === 'empresa' ? 'empresa' : 'cliente',
    nombre: d.nombre || '',
    email: d.email || '',
    soloVegano: d.soloVegano === true,
    alergias: Array.isArray(d.alergias) ? d.alergias : [],
    lang: langs.includes(d.lang) ? d.lang : detectarIdioma(),
  };
}

/** Crea/actualiza perfil (merge: no borra otros campos). */
export async function guardarPerfil(uid, datos) {
  await setDoc(doc(getDb(), 'usuarios', uid), { ...datos, actualizado: serverTimestamp() }, { merge: true });
}
