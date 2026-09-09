/**
 * Controller — sesión del usuario (Firebase Auth).
 * Las Views reciben { usuario, ... } por props.
 */
import { useEffect, useState } from 'react';
import { suscribirSesion, crearCuenta, iniciarSesion, cerrarSesion } from '../services/authApi.js';

export function useAuth() {
  const [usuario, setUsuario] = useState(null); // { nombre, email } | null
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => suscribirSesion((u) => {
    setUsuario(u);
    setCargandoSesion(false);
  }), []);

  return { usuario, cargandoSesion, crearCuenta, iniciarSesion, cerrarSesion };
}
