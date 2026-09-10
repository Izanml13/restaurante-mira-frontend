/**
 * View pura: tabla comparativa lado a lado (2-3 restaurantes).
 * En móvil se apilan tarjetas (misma data, otro layout).
 * Todo por props (resúmenes ya calculados); sin lecturas.
 */
import { resumenRestaurante } from '../models/restaurantModel.js';

function fmtDistancia(km) {
  if (km == null) return '—';
  return `A ${km.toLocaleString('es-ES', { maximumFractionDigits: 1 })} km`;
}

function fmtNota(v) {
  return v > 0 ? `★ ${v.toLocaleString('es-ES')}` : '—';
}

function Cabecera({ s, r, onVerCarta, onReservar, onQuitar }) {
  return (
    <div className="comparador-cab">
      <img src={s.imagen} alt="" loading="lazy" className="comparador-foto" />
      <strong>{s.nombre}</strong>
      <span className="comparador-botones">
        <button type="button" className="btn-secundario btn-peq" onClick={() => onVerCarta(r)}>
          Ver carta
        </button>
        <button type="button" className="btn-secundario btn-peq" onClick={() => onReservar(r)}>
          Reservar
        </button>
        <button type="button" className="btn-texto" onClick={() => onQuitar(s.id)}>
          Quitar
        </button>
      </span>
    </div>
  );
}

// Filas comparables: get numérico para el resaltado, fmt para pintar.
function filasDe(conAptos) {
  const filas = [
    { label: 'Nota Yelp', get: (s) => (s.notaYelp > 0 ? s.notaYelp : null), fmt: (s) => (<>{fmtNota(s.notaYelp)} <span className="comparador-detalle">({s.totalYelp.toLocaleString('es-ES')})</span></>), mejor: 'max' },
    { label: 'Nota MIRA', get: (s) => (s.notaMira > 0 ? s.notaMira : null), fmt: (s) => fmtNota(s.notaMira), mejor: 'max' },
    { label: 'Mejor nota', get: (s) => (s.mejorNota > 0 ? s.mejorNota : null), fmt: (s) => fmtNota(s.mejorNota), mejor: 'max' },
    { label: 'Precio', get: (s) => s.precio.length, fmt: (s) => s.precio, mejor: 'min' },
    { label: 'Distancia', get: (s) => s.distanciaKm, fmt: (s) => fmtDistancia(s.distanciaKm), mejor: 'min' },
    { label: 'Ciudad', get: null, fmt: (s) => s.ciudad || '—', mejor: null },
  ];
  if (conAptos) {
    filas.push({ label: 'Aptos para ti', get: (s) => s.aptos, fmt: (s) => (s.aptos ?? '—'), mejor: 'max' });
  }
  filas.push(
    { label: 'Carta', get: null, fmt: (s) => `${s.secciones} secciones · ${s.platos} platos`, mejor: null },
    { label: 'Más barato', get: null, fmt: (s) => (s.barato ? `${s.barato.nombre} (${s.barato.precio} €)` : '—'), mejor: null },
    { label: 'Más caro', get: null, fmt: (s) => (s.caro ? `${s.caro.nombre} (${s.caro.precio} €)` : '—'), mejor: null },
  );
  return filas;
}

export default function Comparador({ restaurantes, dieta, onVerCarta, onReservar, onQuitar }) {
  const datos = restaurantes.map((r) => ({ r, s: resumenRestaurante(r, dieta) }));
  if (datos.length < 2) return null;
  const conAptos = datos.some((d) => d.s.aptos != null);
  const filas = filasDe(conAptos);

  function ganadores(fila) {
    if (!fila.mejor || !fila.get) return new Set();
    const vals = datos.map((d) => fila.get(d.s)).filter((v) => v != null);
    if (!vals.length) return new Set();
    const top = fila.mejor === 'min' ? Math.min(...vals) : Math.max(...vals);
    return new Set(datos.filter((d) => fila.get(d.s) === top).map((d) => d.s.id));
  }

  return (
    <section className="comparador" aria-labelledby="comparador-titulo">
      <h2 id="comparador-titulo" className="cuenta-sub">
        Comparando {datos.length}
      </h2>

      {/* Escritorio: tabla lado a lado */}
      <div className="comparador-scroll solo-escritorio">
        <table className="comparador-tabla">
          <thead>
            <tr>
              <th scope="col">
                <span className="comparador-etiqueta">Restaurante</span>
              </th>
              {datos.map(({ r, s }) => (
                <th key={s.id} scope="col" className="comparador-col">
                  <Cabecera s={s} r={r} onVerCarta={onVerCarta} onReservar={onReservar} onQuitar={onQuitar} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => {
              const top = ganadores(fila);
              return (
                <tr key={fila.label}>
                  <th scope="row">{fila.label}</th>
                  {datos.map(({ s }) => (
                    <td key={s.id} className={top.has(s.id) ? 'comparador-mejor' : undefined}>
                      {fila.fmt(s)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Móvil: tarjetas apiladas */}
      <div className="solo-movil" style={{ display: 'grid', gap: '0.8rem' }}>
        {datos.map(({ r, s }) => (
          <article key={s.id} className="comparador-tarjeta">
            <Cabecera s={s} r={r} onVerCarta={onVerCarta} onReservar={onReservar} onQuitar={onQuitar} />
            <dl className="comparador-lista">
              {filas.map((fila) => {
                const top = ganadores(fila);
                return (
                  <div key={fila.label} className={top.has(s.id) ? 'comparador-mejor' : undefined}>
                    <dt>{fila.label}</dt>
                    <dd>{fila.fmt(s)}</dd>
                  </div>
                );
              })}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
