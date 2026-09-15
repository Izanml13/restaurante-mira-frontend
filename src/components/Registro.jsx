/** View pura: página de creación de cuenta con dieta/accesibilidad/idioma en el formulario. */
import { useState } from 'react';
import { ALERGENOS } from '../models/restaurantModel.js';
import { AVAILABLE, detectarIdioma } from '../i18n/index.jsx';

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Registro({ onRegistro, yaTieneSesion }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [esEmpresa, setEsEmpresa] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [paso, setPaso] = useState(1); // 1 = datos, 2 = dieta/accesibilidad

  const [vegano, setVegano] = useState(false);
  const [vegetariano, setVegetariano] = useState(false);
  const [sinGluten, setSinGluten] = useState(false);
  const [alergias, setAlergias] = useState([]);
  const [sillaRuedas, setSillaRuedas] = useState(false);
  const [tea, setTea] = useState(false);
  const [lang, setLang] = useState(detectarIdioma);

  function toggleAlergia(key) {
    setAlergias((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    if (paso === 1) {
      if (nombre.trim().length < 2) return setError('Escribe tu nombre (mínimo 2 letras).');
      if (!EMAIL_OK.test(email.trim())) return setError('Escribe un correo válido.');
      if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
      setError('');
      setPaso(2);
      return;
    }
    setError('');
    setEnviando(true);
    try {
      const preferencias = { vegano, vegetariano, sinGluten, alergias };
      const accesibilidad = { sillaRuedas, tea };
      await onRegistro({
        nombre,
        email,
        password,
        tipo: esEmpresa ? 'empresa' : 'cliente',
        preferencias,
        accesibilidad,
        lang,
      });
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

        {paso === 1 && (
          <>
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
            <button type="submit" className="btn-cta btn-grande auth-boton">
              Siguiente
            </button>
          </>
        )}

        {paso === 2 && (
          <>
            <h2 className="cuenta-sub" style={{ fontSize: '1.05rem', margin: '1rem 0 0.5rem' }}>Mi dieta</h2>
            <label className="campo-check" htmlFor="reg-vegano">
              <input id="reg-vegano" type="checkbox" checked={vegano} onChange={() => setVegano(!vegano)} />
              Vegano: solo platos 100% vegetales
            </label>
            <label className="campo-check" htmlFor="reg-vegetariano">
              <input id="reg-vegetariano" type="checkbox" checked={vegetariano} onChange={() => setVegetariano(!vegetariano)} />
              Vegetariano: sin carne ni pescado
            </label>
            <label className="campo-check" htmlFor="reg-sinGluten">
              <input id="reg-sinGluten" type="checkbox" checked={sinGluten} onChange={() => setSinGluten(!sinGluten)} />
              Sin gluten
            </label>
            <fieldset className="prefs-alergias" style={{ border: 'none', padding: 0 }}>
              <legend style={{ fontWeight: 600, fontSize: '0.95rem' }}>Mis alergias</legend>
              {ALERGENOS.map(({ key, label }) => (
                <label key={key} className="campo-check" htmlFor={`reg-alerg-${key}`}>
                  <input
                    id={`reg-alerg-${key}`}
                    type="checkbox"
                    checked={alergias.includes(key)}
                    onChange={() => toggleAlergia(key)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>

            <h2 className="cuenta-sub" style={{ fontSize: '1.05rem', margin: '1rem 0 0.5rem' }}>Mi accesibilidad</h2>
            <label className="campo-check" htmlFor="reg-silla">
              <input id="reg-silla" type="checkbox" checked={sillaRuedas} onChange={() => setSillaRuedas(!sillaRuedas)} />
              Voy en silla de ruedas
            </label>
            <label className="campo-check" htmlFor="reg-tea">
              <input id="reg-tea" type="checkbox" checked={tea} onChange={() => setTea(!tea)} />
              Estoy en el espectro autista
            </label>

            <h2 className="cuenta-sub" style={{ fontSize: '1.05rem', margin: '1rem 0 0.5rem' }}>Idioma</h2>
            <select
              className="search-select"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              {Object.entries(AVAILABLE).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>

            <p style={{ fontSize: '0.82rem', color: 'var(--gris)', margin: '0.8rem 0 0.5rem' }}>
              Puedes cambiar estos ajustes después en <a href="#/cuenta">Mi cuenta</a>.
            </p>

            <button type="submit" className="btn-cta btn-grande auth-boton" disabled={enviando}>
              {enviando ? 'Creando…' : 'Crear cuenta'}
            </button>
            <button
              type="button"
              className="btn-secundario btn-peq"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => { setPaso(1); setError(''); }}
            >
              ← Volver
            </button>
          </>
        )}

        <p className="auth-alt">
          ¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a>
        </p>
      </form>
    </section>
  );
}
