/** Página "Mi cuenta": datos + preferencias + dieta + accesibilidad + 2FA + cookies + negocio + reservas + incidencias + reseñas. */
import { useEffect, useState } from 'react';
import { listarMisReservas } from '../services/reservaApi.js';
import { listarMisIncidencias } from '../services/incidenciaApi.js';
import { listarResenasDeUsuario } from '../services/resenasApi.js';
import { listarMisNegocios } from '../services/negocioApi.js';
import { ALERGENOS, normalizarDieta, normalizarAccesibilidad } from '../models/restaurantModel.js';
import { COOKIE_CATEGORIAS, COOKIE_DEFAULT, leerCookies, guardarCookies, tieneConsentimiento } from '../services/cookieService.js';

function hoyISO() {
  const h = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${h.getFullYear()}-${p(h.getMonth() + 1)}-${p(h.getDate())}`;
}

export default function Cuenta({ usuario, perfil, dieta, guardarDieta, accesibilidad, guardarAccesibilidad, onSalir, onEnviarVerificacion, onRecargarEmailVerified }) {
  const [proximas, setProximas] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [misResenas, setMisResenas] = useState([]);
  const [misNegocios, setMisNegocios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [borrador, setBorrador] = useState(() => normalizarDieta(dieta));
  const [guardandoPrefs, setGuardandoPrefs] = useState(false);
  const [prefsOk, setPrefsOk] = useState('');

  useEffect(() => {
    if (!usuario?.uid) {
      window.location.hash = '#/login';
      return;
    }
    let vivo = true;
    Promise.all([
      listarMisReservas(usuario.uid),
      listarMisIncidencias({ uid: usuario.uid, email: usuario.email }),
      listarResenasDeUsuario(usuario.uid),
      listarMisNegocios(usuario.uid).catch(() => []),
    ])
      .then(([todas, inc, res, neg]) => {
        if (!vivo) return;
        const hoy = hoyISO();
        setProximas(todas.filter((r) => r.estado === 'activa' && r.fecha >= hoy).slice(0, 3));
        setIncidencias(inc.slice(0, 5));
        setMisResenas(res.slice(0, 5));
        setMisNegocios(neg.slice(0, 5));
        setCargando(false);
      })
      .catch(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, [usuario]);

  const [borradorAcc, setBorradorAcc] = useState(() => normalizarAccesibilidad(accesibilidad));
  const [guardandoAcc, setGuardandoAcc] = useState(false);
  const [accOk, setAccOk] = useState('');

  useEffect(() => { setBorrador(normalizarDieta(dieta)); }, [dieta]);
  useEffect(() => { setBorradorAcc(normalizarAccesibilidad(accesibilidad)); }, [accesibilidad]);

  function toggleDieta(campo) { setBorrador((prev) => ({ ...prev, [campo]: !prev[campo] })); setPrefsOk(''); }
  function toggleAlergia(key) { setBorrador((prev) => ({ ...prev, alergias: prev.alergias.includes(key) ? prev.alergias.filter((x) => x !== key) : [...prev.alergias, key] })); setPrefsOk(''); }

  async function guardarPrefs(e) {
    e.preventDefault(); setGuardandoPrefs(true); setPrefsOk('');
    try { await guardarDieta(borrador); setPrefsOk('Dieta guardada.'); }
    catch { setPrefsOk('No se pudo guardar. Inténtalo de nuevo.'); }
    finally { setGuardandoPrefs(false); }
  }

  function toggleAcc(campo) { setBorradorAcc((prev) => ({ ...prev, [campo]: !prev[campo] })); setAccOk(''); }
  async function guardarAcc(e) {
    e.preventDefault(); setGuardandoAcc(true); setAccOk('');
    try { await guardarAccesibilidad(borradorAcc); setAccOk('Accesibilidad guardada.'); }
    catch { setAccOk('No se pudo guardar. Inténtalo de nuevo.'); }
    finally { setGuardandoAcc(false); }
  }

  // --- Verificación de email ---
  const [verificando, setVerificando] = useState(false);
  const [verOk, setVerOk] = useState('');
  const [verError, setVerError] = useState('');

  async function enviarVerificacion() {
    setVerError(''); setVerOk(''); setVerificando(true);
    try {
      await onEnviarVerificacion();
      setVerOk('Correo de verificación enviado. Revisa tu bandeja de entrada y haz clic en el enlace.');
    } catch (err) {
      setVerError(err.message || 'No se pudo enviar el correo de verificación.');
    } finally {
      setVerificando(false);
    }
  }

  async function recargarVerificacion() {
    setVerError(''); setVerOk('');
    try {
      const verificado = await onRecargarEmailVerified();
      if (verificado) {
        setVerOk('✓ Tu correo ha sido verificado correctamente.');
      } else {
        setVerError('Tu correo aún no está verificado. Haz clic en el enlace del email.');
      }
    } catch {
      setVerError('No se pudo comprobar el estado. Inténtalo de nuevo.');
    }
  }

  // --- Cookies ---
  const [cookiesPrefs, setCookiesPrefs] = useState({ ...COOKIE_DEFAULT });
  const [cookiesOk, setCookiesOk] = useState('');
  useEffect(() => {
    if (!usuario?.uid) return;
    leerCookies(usuario.uid).then(setCookiesPrefs);
  }, [usuario]);

  async function guardarCookiesCuenta() {
    setCookiesOk('');
    await guardarCookies(cookiesPrefs, usuario?.uid);
    setCookiesOk('Preferencias de cookies guardadas.');
  }

  if (!usuario) return null;

  const inicial = (usuario.nombre || usuario.email || '?').trim().charAt(0).toUpperCase();
  const miembroDesde = usuario.creado
    ? new Date(usuario.creado).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <section className="auth-pagina" aria-labelledby="cuenta-titulo">
      <div className="auth-tarjeta">
        <p className="cuenta-avatar" aria-hidden="true">{inicial}</p>
        <h1 id="cuenta-titulo">{usuario.nombre || 'Mi cuenta'}</h1>
        <dl className="cuenta-datos">
          <div><dt>Correo</dt><dd>{usuario.email}</dd></div>
          <div><dt>Miembro desde</dt><dd>{miembroDesde}</dd></div>
          {mfaActivo && <div><dt>2FA</dt><dd style={{ color: 'var(--verde)' }}>✓ Activado</dd></div>}
        </dl>
        <p className="cuenta-acciones">
          <a href="#buscar" className="btn-cta">Buscar restaurantes</a>
          <button type="button" className="btn-secundario" onClick={onSalir}>Cerrar sesión</button>
        </p>

        {/* --- DIETA --- */}
        <h2 className="cuenta-sub">Mi dieta</h2>
        <form onSubmit={guardarPrefs} className="prefs-form">
          {[['vegano', 'Vegano'], ['vegetariano', 'Vegetariano'], ['sinGluten', 'Sin gluten']].map(([campo, etiqueta]) => (
            <label key={campo} className="campo-check" htmlFor={`pref-${campo}`}>
              <input id={`pref-${campo}`} type="checkbox" checked={Boolean(borrador[campo])} onChange={() => toggleDieta(campo)} />
              {etiqueta}
            </label>
          ))}
          <fieldset className="prefs-alergias">
            <legend>Mis alergias</legend>
            {ALERGENOS.map(({ key, label }) => (
              <label key={key} className="campo-check" htmlFor={`alerg-${key}`}>
                <input id={`alerg-${key}`} type="checkbox" checked={borrador.alergias.includes(key)} onChange={() => toggleAlergia(key)} />
                {label}
              </label>
            ))}
          </fieldset>
          <button type="submit" className="btn-secundario btn-peq" disabled={guardandoPrefs}>
            {guardandoPrefs ? 'Guardando…' : 'Guardar dieta'}
          </button>
          {prefsOk && <p className="vacio-texto" role="status">{prefsOk}</p>}
        </form>

        {/* --- ACCESIBILIDAD --- */}
        <h2 className="cuenta-sub">Mi accesibilidad</h2>
        <form onSubmit={guardarAcc} className="prefs-form">
          <p className="vacio-texto">Solo verás locales con accesibilidad verificada.</p>
          <label className="campo-check" htmlFor="acc-silla">
            <input id="acc-silla" type="checkbox" checked={Boolean(borradorAcc.sillaRuedas)} onChange={() => toggleAcc('sillaRuedas')} />
            Silla de ruedas (acceso sin escalones)
          </label>
          <label className="campo-check" htmlFor="acc-tea">
            <input id="acc-tea" type="checkbox" checked={Boolean(borradorAcc.tea)} onChange={() => toggleAcc('tea')} />
            Espectro autista (entornos tranquilos)
          </label>
          <button type="submit" className="btn-secundario btn-peq" disabled={guardandoAcc}>
            {guardandoAcc ? 'Guardando…' : 'Guardar accesibilidad'}
          </button>
          {accOk && <p className="vacio-texto" role="status">{accOk}</p>}
        </form>

        {/* --- Verificación de email --- */}
        <h2 className="cuenta-sub">Verificación de correo</h2>
        <div className="prefs-form">
          {usuario.emailVerified ? (
            <div style={{ padding: '0.8rem', background: 'var(--fondo-suave)', borderRadius: 'var(--radio-peq)' }}>
              <p style={{ color: 'var(--verde)', fontWeight: 600 }}>✓ Tu correo está verificado.</p>
            </div>
          ) : (
            <>
              <p className="vacio-texto">Tu correo aún no está verificado. Verifícalo para que tu cuenta esté completamente activa.</p>
              {verError && <p className="reserva-error" role="alert">{verError}</p>}
              {verOk && <p className="vacio-texto" role="status" style={{ color: 'var(--verde)' }}>{verOk}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn-secundario btn-peq" onClick={enviarVerificacion} disabled={verificando}>
                  {verificando ? 'Enviando…' : 'Enviar correo de verificación'}
                </button>
                <button type="button" className="btn-texto" onClick={recargarVerificacion}>
                  Ya verifiqué → comprobar
                </button>
              </div>
            </>
          )}
        </div>

        {/* --- COOKIES --- */}
        <h2 className="cuenta-sub">Preferencias de cookies</h2>
        <div className="prefs-form">
          <p className="vacio-texto">Controla qué types de cookies aceptas. Se guardan en tu perfil y se aplican en todas tus sesiones.</p>
          {COOKIE_CATEGORIAS.filter((c) => !c.requerida).map((cat) => (
            <label key={cat.key} className="campo-check" htmlFor={`cookie-${cat.key}`}>
              <input
                id={`cookie-${cat.key}`}
                type="checkbox"
                checked={Boolean(cookiesPrefs[cat.key])}
                onChange={() => setCookiesPrefs((p) => ({ ...p, [cat.key]: !p[cat.key] }))}
              />
              {cat.label} — <span style={{ fontSize: '0.82rem', color: 'var(--gris)' }}>{cat.desc}</span>
            </label>
          ))}
          <button type="button" className="btn-secundario btn-peq" onClick={guardarCookiesCuenta}>
            Guardar cookies
          </button>
          {cookiesOk && <p className="vacio-texto" role="status">{cookiesOk}</p>}
        </div>

        {/* --- NEGOCIO --- */}
        {perfil?.tipo === 'empresa' && (
          <>
            <h2 className="cuenta-sub">Mi negocio</h2>
            <p><a href="#/negocio" className="btn-cta btn-peq">Añadir restaurante</a></p>
            {!cargando && misNegocios.length > 0 && (
              <ul className="lista-registros">
                {misNegocios.map((n) => (
                  <li key={n.id} className="registro">
                    <div>
                      <strong>{n.nombre}</strong>
                      <div className="registro-detalle">
                        {n.ciudad} · {n.estado === 'aprobada' ? 'Publicado' : n.estado === 'rechazada' ? 'Rechazado' : 'En revisión'}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* --- RESERVAS --- */}
        <h2 className="cuenta-sub">Mis próximas reservas</h2>
        {cargando && <p>Cargando…</p>}
        {!cargando && proximas.length === 0 && <p className="vacio-texto">Sin próximas reservas.</p>}
        {!cargando && proximas.length > 0 && (
          <ul className="lista-registros">
            {proximas.map((r) => (
              <li key={r.id} className="registro">
                <div>
                  <strong>{r.nombreRestaurante}</strong>
                  <div className="registro-detalle">
                    {r.fecha} a las {r.hora} · {r.comensales} {Number(r.comensales) === 1 ? 'persona' : 'personas'} · <code>{r.codigo}</code>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p><a href="#/reservas">Ver todas mis reservas</a></p>

        {/* --- INCIDENCIAS --- */}
        <h2 className="cuenta-sub">Mis incidencias</h2>
        {!cargando && incidencias.length === 0 && <p className="vacio-texto">Sin incidencias.</p>}
        {!cargando && incidencias.length > 0 && (
          <ul className="lista-registros">
            {incidencias.map((r) => (
              <li key={r.id} className="registro">
                <div>
                  <strong>{r.motivo}</strong> · {r.estado === 'resuelta' ? 'Resuelta' : 'Pendiente'}
                  <div className="registro-detalle">{r.mensaje}</div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* --- RESEÑAS --- */}
        <h2 className="cuenta-sub">Mis reseñas</h2>
        {!cargando && misResenas.length === 0 && <p className="vacio-texto">Aún no has publicado reseñas.</p>}
        {!cargando && misResenas.length > 0 && (
          <ul className="lista-registros">
            {misResenas.map((r) => (
              <li key={r.id} className="registro">
                <div>
                  <strong>★ {r.puntuacion}</strong>
                  <span className="registro-detalle"> · {r.fecha || ''} · {r.likes || 0} likes</span>
                  <div className="registro-detalle">{r.comentario}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
