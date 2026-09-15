/**
 * Configuración Firebase — prioriza .env, fallback público si falta.
 * Las claves Firebase son públicas por diseño (protegidas por reglas de Firestore).
 */
const raw = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            ?? '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        ?? '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         ?? '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             ?? '',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     ?? '',
};

const fallback = {
  apiKey:            'AIzaSyDUlrIfRRNrJf2Uq40r4RCafe9sYzMOpX8',
  authDomain:        'restaurante-mira-18e0c.firebaseapp.com',
  projectId:         'restaurante-mira-18e0c',
  storageBucket:     'restaurante-mira-18e0c.firebasestorage.app',
  messagingSenderId: '62450147191',
  appId:             '1:62450147191:web:aadad1416875a44309cb72',
  measurementId:     'G-ZHBEN1WBH0',
};

const faltantes = Object.entries(raw).filter(([, v]) => !v);

if (faltantes.length > 0) {
  console.warn(
    `[Firebase] Faltan ${faltantes.length} variable(s) en .env: ${faltantes.map(([k]) => k).join(', ')}. Usando valores públicos de fallback.`,
  );
}

export const firebaseConfig = Object.fromEntries(
  Object.entries(raw).map(([k, v]) => [k, v || fallback[k]]),
);
