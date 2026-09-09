/** View pura: rejilla de resultados + estado vacío. */
import RestaurantCard from './RestaurantCard.jsx';

export default function RestaurantList({ restaurants, onClear, onSelect }) {
  if (restaurants.length === 0) {
    return (
      <div className="vacio" role="status">
        <p className="vacio-titulo">No hemos encontrado restaurantes con esos filtros.</p>
        <p>Prueba con otra zona, cocina, precio o distancia.</p>
        <button type="button" className="btn-cta" onClick={onClear}>
          Limpiar filtros
        </button>
      </div>
    );
  }

  return (
    <ul className="grid">
      {restaurants.map((r) => (
        <li key={r.id}>
          <RestaurantCard restaurant={r} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
