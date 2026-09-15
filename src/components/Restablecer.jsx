/**
 * View pura: restablece la clave con el oobCode del email.
 * Lee oobCode de hash o search, verifica con Firebase y confirma la nueva clave.
 */
import { useEffect, useState } from 'react';
import {
  extraerOobCode,
  verificarCodigoReset,
  confirmarNuevaContrasena,
  enmascararEmail,
} from '../services/authApi.js';

export default function Restablecer({ yaTieneSesion }) {
  const [oobCode, setOobCode] = useState('');
  const [emailMask, setEmailMask] = useState('');
  const [estado, setEstado] = useState('verificando'); // verificando | formulario | exito | error
  const [error, setError] = useState('');
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [ver1, setVer1] = useState(false);
  const [ver2, setVer2] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vivo = true;
    const code = extraerOobCode();
    if (!code) {
      setEstado('error');
      setError('Enlace inválido o caducado.');
      return undefined;
    }
    setOobCode(code);
    verificarCodigoReset(code)
      .then((email) => {
        if (!vivo) return;
        setEmailMask(enmascararEmail(email));
        setEstado('formulario');
      })
      .catch((err) => {
        if (!vivo) return;
        setEstado('error');
        setError(err.message || 'Enlace inválido o caducado.');
      });
    return () => {
      vivo = false;
    };
  }, []);

  if (yaTieneSesion) {
    window.location.hash = '#/';
    return null;
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    if (pass1.length < 6 || pass2.length < 6) {
      return setError('Mínimo 6 caracteres.');
    }
    if (pass1 !== pass2) {
      return setError('Las contraseñas no coinciden.');
    }
    setError('');
    setEnviando(true);
    try {
      await confirmarNuevaContrasena(oobCode, pass1);
      setEstado('exito');
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="auth-pagina" aria-labelledby="restablecer-titulo">
      <div className="auth-tarjeta">
        <h1 id="restablecer-titulo">Nueva contraseña</h1>

        {estado === 'verificando' && (
          <p className="cargando" role="status" aria-live="polite">
            Comprobando enlace…
          </p>
        )}

        {estado === 'error' && (
          <>
            <p className="auth-error" role="alert" aria-live="assertive">
              {error}
            </p>
            <a className="btn-cta btn-grande auth-boton" href="#/recuperar" style={{ textAlign: 'center' }}>
              Pedir otro
            </a>
            <p className="auth-alt">
              <a href="#/login">Volver a iniciar sesión</a>
            </p>
          </>
        )}

        {estado === 'formulario' && (
          <form onSubmit={manejarEnvio} noValidate style={{ display: 'grid', gap: '0.9rem' }}>
            <p className="auth-sub" aria-live="polite">
              Restablecer acceso de {emailMask}.
            </p>
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <div className="campo">
              <label htmlFor="rest-pass1">Nueva contraseña</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  id="rest-pass1"
                  type={ver1 ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={pass1}
                  onChange={(e) => setPass1(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-secundario btn-peq"
                  style={{ marginTop: 0, whiteSpace: 'nowrap' }}
                  onClick={() => setVer1((v) => !v)}
                  aria-label={ver1 ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={ver1}
                >
                  {ver1 ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div className="campo">
              <label htmlFor="rest-pass2">Repite la contraseña</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  id="rest-pass2"
                  type={ver2 ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-secundario btn-peq"
                  style={{ marginTop: 0, whiteSpace: 'nowrap' }}
                  onClick={() => setVer2((v) => !v)}
                  aria-label={ver2 ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={ver2}
                >
                  {ver2 ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-cta btn-grande auth-boton" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </form>
        )}

        {estado === 'exito' && (
          <>
            <p className="auth-sub" role="status" aria-live="polite" style={{ color: 'var(--verde)', fontWeight: 600 }}>
              Contraseña cambiada. Inicia sesión.
            </p>
            <a className="btn-cta btn-grande auth-boton" href="#/login?reset=ok" style={{ textAlign: 'center' }}>
              Ir a iniciar sesión
            </a>
          </>
        )}
      </div>
    </section>
  );
}
