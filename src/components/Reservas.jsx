/** View pura: "Mis reservas" — próximas / pasadas / canceladas + cancelar. */
import { useEffect, useState } from 'react';
import { listarMisReservas, cancelarReserva } from '../services/reservaApi.js';

function hoyISO() {
  const h = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${h.getFullYear()}-${p(h.getMonth() + 1)}-${p(h.getDate())}`;
}

export default function Reservas({ usuario, esAdmin }) {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('proximas');

  useEffect(() => {
    if (!usuario?.uid) {
      window.location.hash = '#/login';
      return;
    }
    let vivo = true;
    setCargando(true);
    listarMisReservas(usuario.uid)
      .then((l) => {
        if (vivo) {
          setLista(l);
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
  }, [usuario]);

  if (!usuario) return null;

  async function handleCancelar(r) {
    if (!window.confirm(`¿Cancelar la reserva del ${r.fecha} a las ${r.hora}?`)) return;
    setError('');
    try {
      await cancelarReserva(r.id, { uid: usuario.uid, esAdmin });
      setLista((prev) => prev.map((x) => (x.id === r.id ? { ...x, estado: 'cancelada' } : x)));
    } catch (e) {
      setError(e.message);
    }
  }

  const hoy = hoyISO();
  const proximas = lista.filter((r) => r.estado === 'activa' && r.fecha >= hoy);
  const pasadas = lista.filter((r) => r.estado === 'activa' && r.fecha < hoy);
  const canceladas = lista.filter((r) => r.estado === 'cancelada');
  const visibles = tab === 'proximas' ? proximas : tab === 'pasadas' ? pasadas : canceladas;

  return (
    <section className="auth-pagina pagina-ancha" aria-labelledby="reservas-titulo">
      <div className="auth-tarjeta tarjeta-ancha">
        <h1 id="reservas-titulo">Mis reservas</h1>
        {cargando && <p>Cargando…</p>}
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {!cargando && (
          <>
            <div className="tabs" role="tablist" aria-label="Filtrar reservas">
              {[
                ['proximas', `Próximas (${proximas.length})`],
                ['pasadas', `Pasadas (${pasadas.length})`],
                ['canceladas', `Canceladas (${canceladas.length})`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  className={tab === key ? 'btn-cta btn-peq' : 'btn-secundario btn-peq'}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            {visibles.length === 0 && (
              <p className="vacio-texto">Nada aquí. Reserva desde la ficha de un restaurante.</p>
            )}
            <ul className="lista-registros">
              {visibles.map((r) => (
                <li key={r.id} className="registro">
                  <div>
                    <strong>{r.nombreRestaurante}</strong>
                    <div className="registro-detalle">
                      {r.fecha} a las {r.hora} · {r.comensales}{' '}
                      {Number(r.comensales) === 1 ? 'persona' : 'personas'} · <code>{r.codigo}</code> ·{' '}
                      {r.estado}
                    </div>
                    {r.comentarios && <div className="registro-detalle">“{r.comentarios}”</div>}
                  </div>
                  {r.estado === 'activa' && r.fecha >= hoy && (
                    <button type="button" className="btn-secundario btn-peq" onClick={() => handleCancelar(r)}>
                      Cancelar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
