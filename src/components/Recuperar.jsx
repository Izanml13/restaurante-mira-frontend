/**
 * Página pública #/recuperar — solicitar enlace de recuperación de contraseña.
 * Mensaje SIEMPRE genérico (no revela si el email existe).
 */
import { useState } from 'react';
import { recuperarContrasena } from '../services/authApi.js';

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Recuperar() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  async function manejarEnvio(e) {
    e.preventDefault();
    const val = email.trim();
    if (!val) { setError('Escribe tu correo electrónico.'); return; }
    if (!EMAIL_OK.test(val)) { setError('El correo no es válido.'); return; }
    setError('');
    setEnviando(true);
    try {
      await recuperarContrasena(val);
      setExito(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="auth-pagina" aria-labelledby="recuperar-titulo">
      <div className="auth-tarjeta">
        <h1 id="recuperar-titulo">Recuperar contraseña</h1>

        {exito ? (
          <div role="status">
            <p style={{ margin: '0 0 0.8rem' }}>
              Si ese correo está registrado, recibirás un enlace para restablecer tu contraseña.
              Revisa también la carpeta de spam.
            </p>
            <p>
              <a href="#/login" className="btn-cta btn-peq">Volver al inicio de sesión</a>
            </p>
          </div>
        ) : (
          <form onSubmit={manejarEnvio}>
            <p className="vacio-texto" style={{ margin: '0 0 0.8rem' }}>
              Introduce el correo asociado a tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
            </p>
            <div className="campo">
              <label htmlFor="rec-email">Correo electrónico</label>
              <input
                id="rec-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="tu@correo.com"
              />
            </div>
            {error && <p className="auth-error" role="alert" style={{ margin: '0.4rem 0' }}>{error}</p>}
            <button type="submit" className="btn-cta" disabled={enviando} style={{ width: '100%', marginTop: '0.6rem' }}>
              {enviando ? 'Enviando…' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        )}

        <p className="auth-alt" style={{ marginTop: '1rem' }}>
          <a href="#/login">← Volver al inicio de sesión</a>
        </p>
      </div>
    </section>
  );
}
