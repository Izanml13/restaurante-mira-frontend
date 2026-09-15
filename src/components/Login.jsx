/** View pura: inicio de sesión + enlace a recuperación por email. */
import { useState } from 'react';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';

const TRADS = { es, ca, en };
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function avisoResetDesdeHash() {
  try {
    const h = window.location.hash || '';
    if (h.includes('reset=ok')) return 'ok';
    if (h.includes('reset=enviado')) return 'enviado';
  } catch {
    /* sin aviso */
  }
  return '';
}

export default function Login({ onLogin, yaTieneSesion }) {
  const t = useT(TRADS);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [avisoReset] = useState(avisoResetDesdeHash);

  async function manejarEnvio(e) {
    e.preventDefault();
    if (!EMAIL_OK.test(email.trim())) return setError(t('auth.correoInvalido'));
    if (password.length < 6) return setError(t('auth.contrasenaCorta'));
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
        <h1 id="login-titulo">{t('auth.iniciarSesion')}</h1>
        <p className="auth-sub">{t('auth.entraParaGuardar')}</p>
        {avisoReset === 'ok' && (
          <p className="auth-sub" role="status" aria-live="polite" style={{ color: 'var(--verde)', fontWeight: 600 }}>
            Contraseña cambiada. Inicia sesión con tu nueva clave.
          </p>
        )}
        {avisoReset === 'enviado' && (
          <p className="auth-sub" role="status" aria-live="polite" style={{ color: 'var(--verde)', fontWeight: 600 }}>
            Si ese correo está registrado, recibirás un enlace. Revisa también spam.
          </p>
        )}
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <div className="campo">
          <label htmlFor="login-email">{t('auth.correo')}</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="login-pass">{t('auth.contrasena')}</label>
          <input
            id="login-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-cta btn-grande auth-boton" disabled={enviando}>
          {enviando ? t('auth.entrando') : t('auth.entrar')}
        </button>

        <p className="auth-alt" style={{ margin: '0.6rem 0 0' }}>
          <a href="#/recuperar">{t('auth.olvidasteContrasena')}</a>
        </p>

        <p className="auth-alt">
          {t('auth.noTienesCuenta')} <a href="#/registro">{t('auth.creaUnaGratis')}</a>
        </p>
      </form>
    </section>
  );
}
