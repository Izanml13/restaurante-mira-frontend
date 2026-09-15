/** View pura: página de inicio de sesión con olvidé contraseña y 2FA SMS. */
import { useState, useRef, useEffect } from 'react';
import { iniciarSesionConMfa, enviarCodigoMfa, verificarMfaLogin, recuperarContrasena } from '../services/authApi.js';

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login({ onLogin, yaTieneSesion }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Olvidé contraseña
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState('');
  const [msgRecuperar, setMsgRecuperar] = useState('');
  const [errorRecuperar, setErrorRecuperar] = useState('');
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false);

  // 2FA
  const [mfaResolver, setMfaResolver] = useState(null);
  const [mfaVerificationId, setMfaVerificationId] = useState(null);
  const [mfaCodigo, setMfaCodigo] = useState('');
  const [mfaTelefono, setMfaTelefono] = useState('');
  const [mfaPaso, setMfaPaso] = useState('init'); // init | enviando | verificando
  const recaptchaRef = useRef(null);
  const recaptchaContainer = useRef(null);

  // Limpiar recaptcha al desmontar
  useEffect(() => {
    return () => {
      try { recaptchaRef.current?.clear?.(); } catch { /* noop */ }
    };
  }, []);

  async function manejarEnvio(e) {
    e.preventDefault();
    if (!EMAIL_OK.test(email.trim())) return setError('Escribe un correo válido.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    setError('');
    setEnviando(true);
    try {
      const resultado = await iniciarSesionConMfa({ email, password });
      if (resultado.exito) {
        window.location.hash = '#/';
        return;
      }
      // 2FA requerido
      setMfaResolver(resultado.mfaResolver);
      setMfaPaso('init');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function enviarCodigo2FA() {
    if (!mfaTelefono.match(/^\+[1-9]\d{6,14}$/)) {
      setError('Introduce el teléfono en formato internacional (ej: +34612345678).');
      return;
    }
    setError('');
    setMfaPaso('enviando');
    try {
      const { verificationId } = await enviarCodigoMfa(mfaTelefono, 'recaptcha-login');
      setMfaVerificationId(verificationId);
      setMfaPaso('verificando');
    } catch (err) {
      setError(err.message || 'No se pudo enviar el SMS. Inténtalo de nuevo.');
      setMfaPaso('init');
    }
  }

  async function verificarCodigo2FA() {
    if (mfaCodigo.length !== 6) {
      setError('El código debe tener 6 dígitos.');
      return;
    }
    setError('');
    setEnviando(true);
    try {
      await verificarMfaLogin(mfaResolver, mfaVerificationId, mfaCodigo);
      window.location.hash = '#/';
    } catch (err) {
      setError('Código incorrecto o expirado. Inténtalo de nuevo.');
      setMfaPaso('init');
      setMfaCodigo('');
    } finally {
      setEnviando(false);
    }
  }

  async function manejarRecuperar(e) {
    e.preventDefault();
    const val = emailRecuperar.trim();
    if (!val) { setErrorRecuperar('Escribe tu correo electrónico.'); return; }
    if (!EMAIL_OK.test(val)) { setErrorRecuperar('El correo no es válido.'); return; }
    setErrorRecuperar('');
    setEnviandoRecuperar(true);
    setMsgRecuperar('');
    try {
      await recuperarContrasena(val);
      setMsgRecuperar('Correo enviado. Revisa tu bandeja de entrada y la carpeta de spam.');
    } catch (err) {
      setErrorRecuperar(err.message);
    } finally {
      setEnviandoRecuperar(false);
    }
  }

  if (yaTieneSesion) {
    window.location.hash = '#/';
    return null;
  }

  // Flujo 2FA: pedir código
  if (mfaResolver) {
    return (
      <section className="auth-pagina" aria-labelledby="mfa-titulo">
        <div className="auth-tarjeta" id="recaptcha-login">
          <h1 id="mfa-titulo">Verificación en dos pasos</h1>
          <p className="auth-sub">Tu cuenta tiene 2FA activo. Introduce el código que hemos enviado por SMS.</p>
          {error && <p className="auth-error" role="alert">{error}</p>}

          {mfaPaso === 'init' && (
            <>
              <div className="campo">
                <label htmlFor="mfa-telefono">Teléfono (formato internacional)</label>
                <input
                  id="mfa-telefono"
                  type="tel"
                  placeholder="+34612345678"
                  value={mfaTelefono}
                  onChange={(e) => setMfaTelefono(e.target.value)}
                />
              </div>
              <button type="button" className="btn-cta btn-grande auth-boton" onClick={enviarCodigo2FA}>
                Enviar código SMS
              </button>
            </>
          )}

          {mfaPaso === 'enviando' && (
            <p className="cargando" role="status">Enviando SMS…</p>
          )}

          {mfaPaso === 'verificando' && (
            <>
              <div className="campo">
                <label htmlFor="mfa-codigo">Código de 6 dígitos</label>
                <input
                  id="mfa-codigo"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={mfaCodigo}
                  onChange={(e) => setMfaCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                />
              </div>
              <button type="button" className="btn-cta btn-grande auth-boton" onClick={verificarCodigo2FA} disabled={enviando}>
                {enviando ? 'Verificando…' : 'Verificar'}
              </button>
              <button
                type="button"
                className="btn-secundario btn-peq"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={() => { setMfaPaso('init'); setMfaCodigo(''); setMfaTelefono(''); }}
              >
                ← Volver
              </button>
            </>
          )}

          <p className="auth-alt">
            <button type="button" className="btn-texto" onClick={() => { setMfaResolver(null); setMfaPaso('init'); }}>
              Iniciar con otra cuenta
            </button>
          </p>
        </div>
      </section>
    );
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
        {msgRecuperar && (
          <p className="auth-sub" role="status" style={{ color: 'var(--verde)', fontWeight: 600 }}>
            {msgRecuperar}
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

        {!mostrarRecuperar ? (
          <p className="auth-alt" style={{ margin: '0.6rem 0 0' }}>
            <button type="button" className="btn-texto" onClick={() => { setMostrarRecuperar(true); setError(''); setMsgRecuperar(''); }}>
              ¿Olvidaste tu contraseña?
            </button>
          </p>
        ) : (
          <form onSubmit={manejarRecuperar} style={{ margin: '0.8rem 0', padding: '0.8rem', background: 'var(--fondo-suave)', borderRadius: 'var(--radio-peq)', border: '1px solid var(--borde)' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.5rem' }}>Recuperar contraseña</p>
            <div className="campo">
              <label htmlFor="recuperar-email">Tu correo</label>
              <input
                id="recuperar-email"
                type="email"
                required
                value={emailRecuperar}
                onChange={(e) => { setEmailRecuperar(e.target.value); setErrorRecuperar(''); }}
                placeholder={email || 'tu@correo.com'}
              />
            </div>
            {errorRecuperar && <p className="auth-error" role="alert" style={{ margin: '0.4rem 0' }}>{errorRecuperar}</p>}
            <button type="submit" className="btn-secundario btn-peq" disabled={enviandoRecuperar}>
              {enviandoRecuperar ? 'Enviando…' : 'Enviar correo de recuperación'}
            </button>
            <button
              type="button"
              className="btn-texto"
              style={{ marginLeft: '0.5rem' }}
              onClick={() => { setMostrarRecuperar(false); setMsgRecuperar(''); setErrorRecuperar(''); }}
            >
              Cancelar
            </button>
          </form>
        )}

        <p className="auth-alt">
          ¿No tienes cuenta? <a href="#/registro">Crea una gratis</a>
        </p>
      </form>
    </section>
  );
}
