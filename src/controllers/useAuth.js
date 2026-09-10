/**
 * Controller — sesión (Firebase Auth) + dieta + favoritos.
 * - Logueado: dieta y favoritos en `usuarios/{uid}` (campos `preferencias` y
 *   `favoritos`); al entrar se fusionan con lo guardado como invitado.
 * - Invitado: todo en localStorage (mira:dieta, mira:favoritos).
 * Las Views reciben todo por props.
 */
import { useEffect, useState } from 'react';
import { suscribirSesion, crearCuenta, iniciarSesion, cerrarSesion } from '../services/authApi.js';
import { esAdmin as comprobarAdmin } from '../services/incidenciaApi.js';
import { obtenerPerfil, guardarPerfil, PERFIL_VACIO } from '../services/perfilApi.js';
import { DIETA_VACIA, normalizarDieta } from '../models/restaurantModel.js';

const LS_DIETA = 'mira:dieta';
const LS_FAVS = 'mira:favoritos';

function leerJSON(clave, defecto) {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? JSON.parse(raw) : defecto;
  } catch {
    return defecto;
  }
}

function guardarJSON(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* almacenamiento lleno o bloqueado: se sigue en memoria */
  }
}

/** Unión sin duplicados (para fusionar favoritos al iniciar sesión). */
export function unirIds(a, b) {
  return [...new Set([...(a || []), ...(b || [])])];
}

export function useAuth() {
  const [usuario, setUsuario] = useState(null); // { uid, nombre, email, creado } | null
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);
  const [perfil, setPerfil] = useState({ ...PERFIL_VACIO });
  const [seqPerfil, setSeqPerfil] = useState(0);
  const [dieta, setDieta] = useState({ ...DIETA_VACIA });
  const [favoritos, setFavoritos] = useState([]);
  const [fusionadoUid, setFusionadoUid] = useState(null);

  useEffect(() => suscribirSesion((u) => {
    setUsuario(u);
    setCargandoSesion(false);
    if (u?.uid) {
      comprobarAdmin(u.uid).then(setEsAdmin).catch(() => setEsAdmin(false));
    } else {
      setEsAdmin(false);
      setPerfil({ ...PERFIL_VACIO });
      // Invitado: dieta y favoritos del navegador.
      setDieta(normalizarDieta(leerJSON(LS_DIETA, DIETA_VACIA)));
      setFavoritos(leerJSON(LS_FAVS, []));
      setFusionadoUid(null);
    }
  }), []);

  // Perfil remoto + fusión de favoritos locales al entrar.
  useEffect(() => {
    if (!usuario?.uid) return;
    let vivo = true;
    obtenerPerfil(usuario.uid)
      .then(async (p) => {
        if (!vivo) return;
        setPerfil(p);
        const dietaRemota = normalizarDieta(p.preferencias ?? p);
        const favsLocales = leerJSON(LS_FAVS, []);
        const favsRemotos = Array.isArray(p.favoritos) ? p.favoritos : [];
        if (fusionadoUid !== usuario.uid && favsLocales.length) {
          // Fusionar una sola vez por sesión: unión y subida.
          const union = unirIds(favsRemotos, favsLocales);
          setFavoritos(union);
          setFusionadoUid(usuario.uid);
          try {
            await guardarPerfil(usuario.uid, { favoritos: union });
          } catch {
            /* sin red: quedan en memoria + local */
          }
        } else {
          setFavoritos(favsRemotos);
        }
        // La dieta remota manda si existe; si no, se conserva la local ya puesta.
        const dietaLocal = leerJSON(LS_DIETA, null);
        const tieneRemota =
          p.preferencias && (p.preferencias.vegano || p.preferencias.vegetariano || p.preferencias.sinGluten || (p.preferencias.alergias || []).length);
        setDieta(tieneRemota ? dietaRemota : normalizarDieta(dietaLocal ?? DIETA_VACIA));
      })
      .catch(() => vivo && setDieta(normalizarDieta(leerJSON(LS_DIETA, DIETA_VACIA))));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, seqPerfil]);

  function recargarPerfil() {
    setSeqPerfil((i) => i + 1);
  }

  /** Guarda dieta (remoto si logueado, si no local). */
  async function guardarDieta(nueva) {
    const d = normalizarDieta(nueva);
    setDieta(d);
    if (usuario?.uid) {
      await guardarPerfil(usuario.uid, { preferencias: d });
    } else {
      guardarJSON(LS_DIETA, d);
    }
  }

  /** Toggle favorito (remoto si logueado, si no local). */
  async function toggleFavorito(id) {
    const tiene = favoritos.includes(id);
    const next = tiene ? favoritos.filter((x) => x !== id) : [...favoritos, id];
    setFavoritos(next);
    if (usuario?.uid) {
      try {
        await guardarPerfil(usuario.uid, { favoritos: next });
      } catch {
        /* sin red: queda en memoria */
      }
    } else {
      guardarJSON(LS_FAVS, next);
    }
    return !tiene;
  }

  return {
    usuario,
    cargandoSesion,
    esAdmin,
    perfil,
    recargarPerfil,
    dieta,
    guardarDieta,
    favoritos,
    toggleFavorito,
    crearCuenta,
    iniciarSesion,
    cerrarSesion,
  };
}
