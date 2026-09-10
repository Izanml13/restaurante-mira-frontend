/** Página "Mi cuenta": datos + preferencias + negocio + reservas + incidencias + reseñas. */
import { useEffect, useState } from 'react';
import { listarMisReservas } from '../services/reservaApi.js';
import { listarMisIncidencias } from '../services/incidenciaApi.js';
import { listarResenasDeUsuario } from '../services/resenasApi.js';
import { listarMisNegocios } from '../services/negocioApi.js';
import { ALERGENOS, normalizarDieta } from '../models/restaurantModel.js';

function hoyISO() {
  const h = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${h.getFullYear()}-${p(h.getMonth() + 1)}-${p(h.getDate())}`;
}

export default function Cuenta({ usuario, perfil, dieta, guardarDieta, onSalir }) {
  const [proximas, setProximas] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [misResenas, setMisResenas] = useState([]);
  const [misNegocios, setMisNegocios] = useState([]);
  const [cargando, setCargando] = useState(true);
  // Borrador de dieta (se guarda con el botón).
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
        setProximas(
          todas.filter((r) => r.estado === 'activa' && r.fecha >= hoy).slice(0, 3),
        );
        setIncidencias(inc.slice(0, 5));
        setMisResenas(res.slice(0, 5));
        setMisNegocios(neg.slice(0, 5));
        setCargando(false);
      })
      .catch(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [usuario]);

  // Sincroniza el borrador cuando llega la dieta guardada.
  useEffect(() => {
    setBorrador(normalizarDieta(dieta));
  }, [dieta]);

  function toggleDieta(campo) {
    setBorrador((prev) => ({ ...prev, [campo]: !prev[campo] }));
    setPrefsOk('');
  }

  function toggleAlergia(key) {
    setBorrador((prev) => ({
      ...prev,
      alergias: prev.alergias.includes(key)
        ? prev.alergias.filter((x) => x !== key)
        : [...prev.alergias, key],
    }));
    setPrefsOk('');
  }

  async function guardarPrefs(e) {
    e.preventDefault();
    setGuardandoPrefs(true);
    setPrefsOk('');
    try {
      await guardarDieta(borrador);
      setPrefsOk('Dieta guardada. El buscador ya la aplica.');
    } catch {
      setPrefsOk('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setGuardandoPrefs(false);
    }
  }

  if (!usuario) return null;

  const inicial = (usuario.nombre || usuario.email || '?').trim().charAt(0).toUpperCase();
  const miembroDesde = usuario.creado
    ? new Date(usuario.creado).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <section className="auth-pagina" aria-labelledby="cuenta-titulo">
      <div className="auth-tarjeta">
        <p className="cuenta-avatar" aria-hidden="true">
          {inicial}
        </p>
        <h1 id="cuenta-titulo">{usuario.nombre || 'Mi cuenta'}</h1>
        <dl className="cuenta-datos">
          <div>
            <dt>Correo</dt>
            <dd>{usuario.email}</dd>
          </div>
          <div>
            <dt>Miembro desde</dt>
            <dd>{miembroDesde}</dd>
          </div>
        </dl>
        <p className="cuenta-acciones">
          <a href="#buscar" className="btn-cta">
            Buscar restaurantes
          </a>
          <button type="button" className="btn-secundario" onClick={onSalir}>
            Cerrar sesión
          </button>
        </p>

        <h2 className="cuenta-sub">Mi dieta</h2>
        <form onSubmit={guardarPrefs} className="prefs-form">
          {[
            ['vegano', 'Vegano: solo platos 100% vegetales'],
            ['vegetariano', 'Vegetariano: sin carne ni pescado'],
            ['sinGluten', 'Sin gluten'],
          ].map(([campo, etiqueta]) => (
            <label key={campo} className="campo-check" htmlFor={`pref-${campo}`}>
              <input
                id={`pref-${campo}`}
                type="checkbox"
                checked={Boolean(borrador[campo])}
                onChange={() => toggleDieta(campo)}
              />
              {etiqueta}
            </label>
          ))}
          <fieldset className="prefs-alergias">
            <legend>Mis alergias (ocultan locales sin platos seguros)</legend>
            {ALERGENOS.map(({ key, label }) => (
              <label key={key} className="campo-check" htmlFor={`alerg-${key}`}>
                <input
                  id={`alerg-${key}`}
                  type="checkbox"
                  checked={borrador.alergias.includes(key)}
                  onChange={() => toggleAlergia(key)}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <button type="submit" className="btn-secundario btn-peq" disabled={guardandoPrefs}>
            {guardandoPrefs ? 'Guardando…' : 'Guardar dieta'}
          </button>
          {prefsOk && (
            <p className="vacio-texto" role="status">
              {prefsOk}
            </p>
          )}
        </form>

        {perfil?.tipo === 'empresa' && (
          <>
            <h2 className="cuenta-sub">Mi negocio</h2>
            <p>
              <a href="#/negocio" className="btn-cta btn-peq">
                Añadir restaurante
              </a>
            </p>
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

        <h2 className="cuenta-sub">Mis próximas reservas</h2>
        {cargando && <p>Cargando…</p>}
        {!cargando && proximas.length === 0 && (
          <p className="vacio-texto">Sin próximas reservas.</p>
        )}
        {!cargando && proximas.length > 0 && (
          <ul className="lista-registros">
            {proximas.map((r) => (
              <li key={r.id} className="registro">
                <div>
                  <strong>{r.nombreRestaurante}</strong>
                  <div className="registro-detalle">
                    {r.fecha} a las {r.hora} · {r.comensales}{' '}
                    {Number(r.comensales) === 1 ? 'persona' : 'personas'} · <code>{r.codigo}</code>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p>
          <a href="#/reservas">Ver todas mis reservas</a>
        </p>

        <h2 className="cuenta-sub">Mis incidencias</h2>
        {!cargando && incidencias.length === 0 && (
          <p className="vacio-texto">Sin incidencias. Escríbenos desde Contacto.</p>
        )}
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

        <h2 className="cuenta-sub">Mis reseñas</h2>
        {!cargando && misResenas.length === 0 && (
          <p className="vacio-texto">Aún no has publicado reseñas.</p>
        )}
        {!cargando && misResenas.length > 0 && (
          <ul className="lista-registros">
            {misResenas.map((r) => (
              <li key={r.id} className="registro">
                <div>
                  <strong>★ {r.puntuacion}</strong>
                  <span className="registro-detalle">
                    {' '}· {r.fecha || (r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('es-ES') : '')} · {r.likes || 0} likes
                  </span>
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
