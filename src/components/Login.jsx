/** View pura: página de inicio de sesión (estado local del form + callbacks). */
import { useState } from 'react';

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login({ onLogin, yaTieneSesion }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e) {
    e.preventDefault();
    if (!EMAIL_OK.test(email.trim())) return setError('Escribe un correo válido.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    setError('');
    setEnviando(true);
    try {
      await onLogin({ email, password });
      window.location.hash = '#/';
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (yaTieneSesion) {
    window.location.hash = '#/';
    return null;
  }

  return (
    <section className="auth-pagina" aria-labelledby="login-titulo">
      <form className="auth-tarjeta" onSubmit={manejarEnvio} noValidate>
        <h1 id="login-titulo">Iniciar sesión</h1>
        <p className="auth-sub">Entra para guardar tus sitios y opinar.</p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <div className="campo">
          <label htmlFor="login-email">Correo</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="login-pass">Contraseña</label>
          <input
            id="login-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-cta btn-grande auth-boton" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="auth-alt">
          ¿No tienes cuenta? <a href="#/registro">Crea una gratis</a>
        </p>
      </form>
    </section>
  );
}
