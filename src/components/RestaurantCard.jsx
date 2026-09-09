/**
 * View pura: ficha de restaurante (foto izquierda, datos derecha).
 * Botón de apertura del detalle; el modal lo orquesta el Controller en App.
 */
function estrellas(valoracion) {
  const llenas = Math.round(valoracion);
  return '★'.repeat(llenas) + '☆'.repeat(Math.max(0, 5 - llenas));
}

export default function RestaurantCard({ restaurant, onSelect }) {
  const {
    nombre,
    cocina,
    precio,
    distanciaKm,
    valoracion,
    totalResenasYelp,
    imagen,
    descripcion,
    ciudad,
  } = restaurant;
  const destacado = valoracion >= 4.7;

  return (
    <article className="card">
      <div className="card-media">
        <img
          className="card-foto"
          src={imagen}
          alt={`${nombre} — cocina ${cocina}`}
          loading="lazy"
        />
        {destacado && <span className="card-top">Recomendado</span>}
      </div>
      <div className="card-cuerpo">
        <h3 className="card-titulo">{nombre}</h3>
        <p className="card-nota">
          <span className="card-estrellas" aria-label={`Valoración ${valoracion} de 5`}>
            {estrellas(valoracion)} {valoracion.toLocaleString('es-ES')}
          </span>{' '}
          <span className="card-opiniones">
            ({(totalResenasYelp ?? 0).toLocaleString('es-ES')} opiniones)
          </span>
        </p>
        <p className="card-gris">
          {cocina} · {precio} · {ciudad}
        </p>
        <p className="card-gris">
          {distanciaKm == null
            ? 'Distancia no disponible'
            : `A ${distanciaKm.toLocaleString('es-ES', { maximumFractionDigits: 1 })} km`}
        </p>
        <p className="card-descripcion">{descripcion}</p>
        <button type="button" className="btn-reservar" onClick={() => onSelect(restaurant)}>
          Ver detalles
        </button>
      </div>
    </article>
  );
}
