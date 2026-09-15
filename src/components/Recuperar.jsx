/** View pura: pide el email y envía el enlace de recuperación (mensaje siempre genérico). */
import { useState } from 'react';
import { recuperarContrasena } from '../services/authApi.js';

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MSG_GENERICO = 'Si ese correo está registrado, recibirás un enlace. Revisa también spam.';

export default function Recuperar({ yaTieneSesion }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (yaTieneSesion) {
    window.location.hash = '#/';
    return null;
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    if (!EMAIL_OK.test(email.trim())) {
      setAviso('');
      return setError('Escribe un correo válido.');
    }
    setError('');
    setAviso('');
    setEnviando(true);
    try {
      await recuperarContrasena(email);
      setAviso(MSG_GENERICO);
    } catch (err) {
      setError(err.message || 'No se pudo enviar el correo. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="auth-pagina" aria-labelledby="recuperar-titulo">
      <form className="auth-tarjeta" onSubmit={manejarEnvio} noValidate>
        <h1 id="recuperar-titulo">Recuperar contraseña</h1>
        <p className="auth-sub">Te enviamos un enlace gratis a tu correo. Se abre bien desde el móvil.</p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {aviso && (
          <p className="auth-sub" role="status" aria-live="polite" style={{ color: 'var(--verde)', fontWeight: 600 }}>
            {aviso}
          </p>
        )}
        <div className="campo">
          <label htmlFor="recuperar-email">Correo</label>
          <input
            id="recuperar-email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-cta btn-grande auth-boton" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar enlace'}
        </button>
        <p className="auth-alt">
          <a href="#/login">Volver a iniciar sesión</a>
        </p>
      </form>
    </section>
  );
}
