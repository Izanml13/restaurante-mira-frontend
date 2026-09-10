/** View pura: página de creación de cuenta (estado local del form + callbacks). */
import { useState } from 'react';

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Registro({ onRegistro, yaTieneSesion }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [esEmpresa, setEsEmpresa] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e) {
    e.preventDefault();
    if (nombre.trim().length < 2) return setError('Escribe tu nombre (mínimo 2 letras).');
    if (!EMAIL_OK.test(email.trim())) return setError('Escribe un correo válido.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    setError('');
    setEnviando(true);
    try {
      await onRegistro({ nombre, email, password, tipo: esEmpresa ? 'empresa' : 'cliente' });
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
    <section className="auth-pagina" aria-labelledby="registro-titulo">
      <form className="auth-tarjeta" onSubmit={manejarEnvio} noValidate>
        <h1 id="registro-titulo">Crear cuenta</h1>
        <p className="auth-sub">Gratis, en menos de un minuto.</p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <div className="campo">
          <label htmlFor="reg-nombre">Nombre</label>
          <input
            id="reg-nombre"
            type="text"
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="reg-email">Correo</label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="reg-pass">Contraseña</label>
          <input
            id="reg-pass"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="campo campo-check">
          <label htmlFor="reg-empresa">
            <input
              id="reg-empresa"
              type="checkbox"
              checked={esEmpresa}
              onChange={(e) => setEsEmpresa(e.target.checked)}
            />
            Soy empresa: quiero añadir mi restaurante
          </label>
        </div>
        <button type="submit" className="btn-cta btn-grande auth-boton" disabled={enviando}>
          {enviando ? 'Creando…' : 'Crear cuenta'}
        </button>
        <p className="auth-alt">
          ¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a>
        </p>
      </form>
    </section>
  );
}
