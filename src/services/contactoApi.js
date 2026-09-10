/**
 * Model — formulario de contacto. Guarda 1 doc por envío en 'contactos'.
 * Requiere regla allow create en Firestore (ver README). ~1 write por envío.
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from './firebase.js';

/**
 * @param {{ nombre:string, email:string, motivo:string, mensaje:string, usuario?:{uid?:string,email?:string}|null }}
 */
export async function enviarContacto({ nombre, email, motivo, mensaje, usuario = null }) {
  try {
    await addDoc(collection(getDb(), 'contactos'), {
      uid: usuario?.uid ?? null,
      nombre: nombre.trim(),
      email: email.trim(),
      motivo,
      mensaje: mensaje.trim(),
      estado: 'pendiente',
      creado: serverTimestamp(),
    });
  } catch (e) {
    if (e.code === 'permission-denied') {
      throw new Error('Falta permiso: publica las reglas de Firestore para «contactos» (ver README).');
    }
    throw new Error('No se pudo enviar el mensaje. Inténtalo de nuevo.');
  }
}
