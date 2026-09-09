/**
 * Model — inicialización perezosa del SDK web de Firebase.
 * Falla con mensaje claro si falta firebaseConfig (ver README).
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig.js';

export function configValida() {
  return Boolean(firebaseConfig.apiKey) && !String(firebaseConfig.apiKey).startsWith('PEGA');
}

let app = null;
let db = null;

function obtenerApp() {
  if (!configValida()) {
    throw new Error(
      'Falta firebaseConfig: pega tu configuración web en src/services/firebaseConfig.js (pasos en README).',
    );
  }
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

/** Devuelve el Firestore ya inicializado o lanza error explicativo. */
export function getDb() {
  if (!db) db = getFirestore(obtenerApp());
  return db;
}

/** Devuelve la Firebase App (para Auth) o lanza error explicativo. */
export function getFirebaseApp() {
  return obtenerApp();
}
