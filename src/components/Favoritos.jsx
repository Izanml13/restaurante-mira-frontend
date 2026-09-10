/**
 * View pura: #/favoritos — rejilla de guardados + comparador de cartas.
 * Resuelve los ids contra lo ya cargado y solo lee de Firestore los que falten.
 * La selección a comparar vive aquí (se pierde al salir, vale).
 */
import { useEffect, useState } from 'react';
import RestaurantCard from './RestaurantCard.jsx';
import Comparador from './Comparador.jsx';

const MAX_COMPARAR = 3;

export default function Favoritos({
  ids,
  dieta,
  onObtenerRestaurante,
  onVerCarta,
  onReservar,
  onToggleFavorito,
}) {
  const [locales, setLocales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [comparar, setComparar] = useState([]);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setComparar((prev) => prev.filter((id) => (ids || []).includes(id)));
    Promise.all((ids || []).map((id) => onObtenerRestaurante(id)))
      .then((list) => {
        if (vivo) {
          setLocales(list.filter(Boolean));
          setCargando(false);
        }
      })
      .catch(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [ids, onObtenerRestaurante]);

  function toggleComparar(id) {
    if (comparar.includes(id)) {
      setComparar(comparar.filter((x) => x !== id));
      setAviso('');
    } else if (comparar.length >= MAX_COMPARAR) {
      setAviso(`Máximo ${MAX_COMPARAR} para comparar. Quita uno primero.`);
    } else {
      setComparar([...comparar, id]);
      setAviso('');
    }
  }

  const seleccionados = comparar
    .map((id) => locales.find((r) => String(r.id) === String(id)))
    .filter(Boolean);

  return (
    <section className="auth-pagina pagina-ancha" aria-labelledby="favoritos-titulo">
      <div className="auth-tarjeta tarjeta-ancha">
        <h1 id="favoritos-titulo">Mis favoritos ({locales.length})</h1>
        {cargando && <p>Cargando…</p>}
        {!cargando && locales.length === 0 && (
          <div role="status">
            <p className="vacio-texto">Aún no tienes favoritos. Guarda locales con el corazón ♥.</p>
            <p>
              <a href="#buscar" className="btn-cta btn-peq">
                Buscar restaurantes
              </a>
            </p>
          </div>
        )}
        {!cargando && locales.length > 0 && (
          <>
            <ul className="grid">
              {locales.map((r) => (
                <li key={r.id}>
                  <label className="comparar-check">
                    <input
                      type="checkbox"
                      checked={comparar.includes(r.id)}
                      onChange={() => toggleComparar(r.id)}
                    />
                    Añadir a comparar
                  </label>
                  <RestaurantCard
                    restaurant={r}
                    esFavorito={() => true}
                    onToggleFavorito={onToggleFavorito}
                    onVerCarta={onVerCarta}
                    onSelect={onReservar}
                  />
                </li>
              ))}
            </ul>
            {aviso && (
              <p className="auth-error" role="alert">
                {aviso}
              </p>
            )}
            <p className="comparar-acciones">
              <button
                type="button"
                className="btn-cta"
                disabled={seleccionados.length < 2}
                title={seleccionados.length < 2 ? 'Elige al menos 2 para comparar' : undefined}
                onClick={() => document.getElementById('comparador')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Comparar ({seleccionados.length})
              </button>
            </p>
            {seleccionados.length >= 2 && (
              <div id="comparador">
                <Comparador
                  restaurantes={seleccionados}
                  dieta={dieta}
                  onVerCarta={onVerCarta}
                  onReservar={onReservar}
                  onQuitar={(id) => toggleComparar(id)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
