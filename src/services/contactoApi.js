/**
 * Model — formulario de contacto. Guarda 1 doc por envío en 'contactos'.
 * Requiere regla allow create en Firestore (ver README). ~1 write por envío.
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from './firebase.js';

/**
 * @param {{ nombre:string, email:string, motivo:string, mensaje:string }}
 */
export async function enviarContacto({ nombre, email, motivo, mensaje }) {
  try {
    await addDoc(collection(getDb(), 'contactos'), {
      nombre: nombre.trim(),
      email: email.trim(),
      motivo,
      mensaje: mensaje.trim(),
      creado: serverTimestamp(),
    });
  } catch (e) {
    if (e.code === 'permission-denied') {
      throw new Error('Falta permiso: publica las reglas de Firestore para «contactos» (ver README).');
    }
    throw new Error('No se pudo enviar el mensaje. Inténtalo de nuevo.');
  }
}
