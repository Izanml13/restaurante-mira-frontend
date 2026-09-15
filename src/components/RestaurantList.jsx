/**
 * View pura: rejilla de resultados + estado vacío + centinela de scroll infinito.
 * Cuando hay más portada por cargar, el centinela dispara onLoadMore al entrar en vista.
 */
import { useEffect, useRef } from 'react';
import RestaurantCard from './RestaurantCard.jsx';
import RestaurantSkeleton from './RestaurantSkeleton.jsx';

const SKELETONS_CARGANDO_MAS = 3;

export default function RestaurantList({ restaurants, filtros, onClear, onSelect, hayMas, cargandoMas, onLoadMore, esFavorito, onToggleFavorito, onVerCarta, cargandoInicial }) {
  const centinela = useRef(null);

  useEffect(() => {
    if (!hayMas || typeof onLoadMore !== 'function') return undefined;
    const el = centinela.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) onLoadMore();
      },
      { rootMargin: '600px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hayMas, onLoadMore]);

  if (restaurants.length === 0 && !hayMas && !cargandoInicial) {
    const hayBusqueda = filtros?.q?.trim();
    return (
      <div className="vacio" role="status">
        <p className="vacio-titulo">No se encontraron restaurantes</p>
        <p>{hayBusqueda ? `Sin resultados para "${filtros.q}". Prueba con otro nombre o ajusta los filtros.` : 'Prueba con otra zona, cocina, precio, día u hora.'}</p>
        <button type="button" className="btn-cta" onClick={onClear}>
          Limpiar filtros
        </button>
      </div>
    );
  }

  return (
    <>
      <ul className="grid">
        {restaurants.map((r) => (
          <li key={r.id}>
            <RestaurantCard restaurant={r} filtros={filtros} onSelect={onSelect} esFavorito={esFavorito ? esFavorito(r.id) : false} onToggleFavorito={onToggleFavorito} onVerCarta={onVerCarta} />
          </li>
        ))}
        {cargandoMas && Array.from({ length: SKELETONS_CARGANDO_MAS }, (_, i) => (
          <li key={`skeleton-mas-${i}`}><RestaurantSkeleton /></li>
        ))}
      </ul>
      {hayMas && (
        <div ref={centinela} aria-hidden={!cargandoMas}>
          {cargandoMas && <span className="sr-only">Cargando más restaurantes…</span>}
        </div>
      )}
    </>
  );
}
