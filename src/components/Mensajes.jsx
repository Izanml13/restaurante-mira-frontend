/** View pura: #/mensajes — buzón interno (avisos de reservas, etc.). */
import { useEffect, useState } from 'react';
import { listarMensajes, marcarLeido } from '../services/mensajesApi.js';

export default function Mensajes({ usuario, onLeidos }) {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(null); // id expandido

  useEffect(() => {
    if (!usuario?.uid) {
      window.location.hash = '#/login';
      return;
    }
    let vivo = true;
    listarMensajes(usuario.uid)
      .then((l) => vivo && (setLista(l), setCargando(false)))
      .catch((e) => vivo && (setError(e.message), setCargando(false)));
    return () => {
      vivo = false;
    };
  }, [usuario]);

  if (!usuario) return null;

  async function alternar(m) {
    const vaAbrir = abierto !== m.id;
    setAbierto(vaAbrir ? m.id : null);
    if (vaAbrir && m.leido !== true) {
      try {
        await marcarLeido(m.id);
        setLista((prev) => prev.map((x) => (x.id === m.id ? { ...x, leido: true } : x)));
        onLeidos?.();
      } catch {
        /* queda como no leído */
      }
    }
  }

  const noLeidos = lista.filter((m) => m.leido !== true).length;

  return (
    <section className="auth-pagina pagina-ancha" aria-labelledby="mensajes-titulo">
      <div className="auth-tarjeta tarjeta-ancha">
        <h1 id="mensajes-titulo">
          Mensajes {noLeidos > 0 && <span className="badge-noleidos">{noLeidos} sin leer</span>}
        </h1>
        {cargando && <p>Cargando…</p>}
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {!cargando && !error && lista.length === 0 && (
          <p className="vacio-texto">Sin mensajes. Cuando tengas una reserva próxima, TEAM MIRA te avisará aquí.</p>
        )}
        <ul className="lista-registros">
          {lista.map((m) => {
            const esAbierto = abierto === m.id;
            const sinLeer = m.leido !== true;
            return (
              <li key={m.id} className={`registro registro-mensaje${sinLeer ? ' no-leido' : ''}`}>
                <button
                  type="button"
                  className="mensaje-cab"
                  aria-expanded={esAbierto}
                  onClick={() => alternar(m)}
                >
                  <span className="mensaje-punto" aria-hidden="true">
                    {sinLeer ? '●' : '○'}
                  </span>
                  <span>
                    <strong>{m.titulo}</strong>
                    <span className="registro-detalle">
                      {' '}
                      · {m.fecha || ''} {m.hora || ''}
                    </span>
                  </span>
                </button>
                {esAbierto && (
                  <>
                    <p className="mensaje-cuerpo" style={{ whiteSpace: 'pre-line' }}>{m.cuerpo}</p>
                    {(m.parkingLink || m.parkingNombre) && (
                      <p className="mensaje-parking" style={{ fontSize: '0.88rem' }}>
                        🅿️ Parking: {m.parkingNombre || 'recomendado'}
                        {m.parkingDistanciaM != null
                          ? ` a ${m.parkingDistanciaM < 1000 ? `${m.parkingDistanciaM} m` : `${(m.parkingDistanciaM / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} km`}`
                          : ''}{' '}
                        {m.parkingLink && (
                          <a href={m.parkingLink} target="_blank" rel="noreferrer">
                            Cómo llegar al parking
                          </a>
                        )}
                      </p>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
