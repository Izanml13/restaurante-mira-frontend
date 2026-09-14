/**
 * View pura: ficha de restaurante minimalista con hover elevación + zoom.
 */
function estrellas(valoracion) {
  const llenas = Math.round(valoracion);
  return '★'.repeat(llenas) + '☆'.repeat(Math.max(0, 5 - llenas));
}

function disponibilidadTexto(r, filtros){
  if (!filtros) return null;
  const { dia, franja, hora } = filtros;
  if (!dia && !franja && !hora) return null;
  // lógica simple: comprobar cierres simulados
  if (dia === 'Lunes' && r.cocina === 'Asador') return 'Cerrado el lunes';
  if (dia === 'Martes' && r.cocina === 'Fusión') return 'Cerrado el martes';
  if (franja === 'cena' && r.cocina === 'Vegana' && r.precio === '€') return 'Solo desayuno/comida';
  return `Disponible ${dia ? dia : ''} ${franja ? `· ${franja}` : ''} ${hora ? hora : ''}`.trim();
}

export default function RestaurantCard({ restaurant, filtros, esFavorito, onToggleFavorito, onVerCarta, onSelect, children }) {
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
  const disp = disponibilidadTexto(restaurant, filtros);

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
        <span className="card-precio-badge">{precio}</span>
        {onToggleFavorito && (
          <button
            type="button"
            className={`card-fav${esFavorito ? ' card-fav-activo' : ''}`}
            aria-pressed={Boolean(esFavorito)}
            aria-label={esFavorito ? `Quitar ${nombre} de favoritos` : `Guardar ${nombre} en favoritos`}
            title={esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            onClick={() => onToggleFavorito(restaurant.id)}
          >
            ♥
          </button>
        )}
      </div>
      <div className="card-cuerpo">
        <h3 className="card-titulo">{nombre}</h3>
        <p className="card-nota">
          {valoracion > 0 ? (
            <>
              <span className="card-estrellas" aria-label={`Valoración ${valoracion} de 5`}>
                {estrellas(valoracion)} {valoracion.toLocaleString('es-ES')}
              </span>{' '}
              <span className="card-opiniones">
                ({(totalResenasYelp ?? 0).toLocaleString('es-ES')} opiniones)
              </span>
            </>
          ) : (
            <span className="card-nuevo">Nuevo · sin valoraciones aún</span>
          )}
        </p>
        <p className="card-gris">
          {cocina} · {ciudad}
          {restaurant.accesoDiscapacidad === true && (
            <span className="card-accesible" title="Acceso adaptado verificado">
              {' '}· Accesible
            </span>
          )}
        </p>
        <p className="card-gris" style={{display:'flex',alignItems:'center',gap:'0.3rem'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="3"/></svg>
          {distanciaKm == null ? 'Distancia no disponible' : `A ${distanciaKm.toLocaleString('es-ES', { maximumFractionDigits: 1 })} km`}
        </p>
        {disp && <p className="card-disponibilidad" style={{fontSize:'0.78rem',color: disp.includes('Cerrado') ? '#b42318' : 'var(--verde)', fontWeight:600, margin:'0.1rem 0 0'}}>{disp}</p>}
        <p className="card-descripcion">{descripcion}</p>
        {children}
        <p className="card-acciones">
          <button type="button" className="btn-reservar" onClick={() => onSelect(restaurant)}>
            Ver más información
          </button>
          {onVerCarta && (
            <button type="button" className="btn-secundario" onClick={() => onVerCarta(restaurant)}>
              Ver carta
            </button>
          )}
        </p>
      </div>
    </article>
  );
}
