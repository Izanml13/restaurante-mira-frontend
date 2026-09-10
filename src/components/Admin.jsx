/** View pura: panel admin — incidencias + locales propuestos. */
import { useEffect, useState } from 'react';
import { listarPendientes, resolverIncidencia } from '../services/incidenciaApi.js';
import { listarNegociosPendientes, aprobarNegocio, rechazarNegocio } from '../services/negocioApi.js';

export default function Admin({ usuario, esAdmin }) {
  const [lista, setLista] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuario?.uid) {
      window.location.hash = '#/login';
      return;
    }
    if (!esAdmin) {
      setCargando(false);
      return;
    }
    let vivo = true;
    Promise.all([listarPendientes(), listarNegociosPendientes()])
      .then(([l, n]) => {
        if (vivo) {
          setLista(l);
          setNegocios(n);
          setCargando(false);
        }
      })
      .catch((e) => {
        if (vivo) {
          setError(e.message);
          setCargando(false);
        }
      });
    return () => {
      vivo = false;
    };
  }, [usuario, esAdmin]);

  if (!usuario) return null;

  async function handleResolver(id) {
    setError('');
    try {
      await resolverIncidencia(id);
      setLista((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAprobar(id) {
    setError('');
    try {
      await aprobarNegocio(id);
      setNegocios((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleRechazar(id) {
    setError('');
    try {
      await rechazarNegocio(id);
      setNegocios((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="auth-pagina pagina-ancha" aria-labelledby="admin-titulo">
      <div className="auth-tarjeta tarjeta-ancha">
        <h1 id="admin-titulo">Administración</h1>
        {esAdmin && <h2 className="cuenta-sub">Incidencias pendientes</h2>}
        {cargando && <p>Cargando…</p>}
        {!cargando && !esAdmin && (
          <p className="auth-error" role="alert">
            Sin acceso: esta zona es solo para administradores.
          </p>
        )}
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {!cargando && esAdmin && lista.length === 0 && !error && (
          <p className="vacio-texto">No hay incidencias pendientes. Buen trabajo.</p>
        )}
        {!cargando && esAdmin && lista.length > 0 && (
          <ul className="lista-registros">
            {lista.map((r) => (
              <li key={r.id} className="registro">
                <div>
                  <strong>{r.motivo}</strong> · {r.nombre} ({r.email})
                  <div className="registro-detalle">{r.mensaje}</div>
                </div>
                <button type="button" className="btn-cta btn-peq" onClick={() => handleResolver(r.id)}>
                  Resolver
                </button>
              </li>
            ))}
          </ul>
        )}

        {esAdmin && <h2 className="cuenta-sub">Locales propuestos</h2>}
        {!cargando && esAdmin && negocios.length === 0 && !error && (
          <p className="vacio-texto">No hay propuestas pendientes.</p>
        )}
        {!cargando && esAdmin && negocios.length > 0 && (
          <ul className="lista-registros">
            {negocios.map((n) => (
              <li key={n.id} className="registro">
                <div>
                  <strong>{n.nombre}</strong> · {n.ciudad} ({(n.categorias || []).join(', ')})
                  <div className="registro-detalle">
                    {n.direccion} · {n.precio} · {n.email}
                    {n.descripcion ? ` — ${n.descripcion}` : ''}
                  </div>
                  <div className="registro-detalle">
                    Acceso: {n.accesoDiscapacidad == null ? '¿?' : n.accesoDiscapacidad ? 'sí' : 'no'}
                    {' '}· Infantil: {n.menuInfantil == null ? '¿?' : n.menuInfantil ? 'sí' : 'no'}
                    {' '}· Tronas: {n.tronas == null ? '¿?' : n.tronas ? 'sí' : 'no'}
                    {' '}· Tranquilo: {n.entornoTranquilo == null ? '¿?' : n.entornoTranquilo ? 'sí' : 'no'}
                    {' '}· Terraza: {n.terraza == null ? '¿?' : n.terraza ? 'sí' : 'no'}
                    {n.alergenos ? ` · Alérgenos: ${n.alergenos}` : ''}
                  </div>
                </div>
                <span style={{ display: 'flex', gap: '0.4rem' }}>
                  <button type="button" className="btn-cta btn-peq" onClick={() => handleAprobar(n.id)}>
                    Aprobar
                  </button>
                  <button type="button" className="btn-secundario btn-peq" onClick={() => handleRechazar(n.id)}>
                    Rechazar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
