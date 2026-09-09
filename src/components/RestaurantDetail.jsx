/**
 * View pura: modal de detalle (diálogo accesible).
 * A la izquierda ficha + reseñas; a la derecha mapa OpenStreetMap (embed gratis, sin claves).
 * El cierre con Escape vive en el Controller; aquí backdrop y botón.
 */
import { useState } from 'react';

const MOSTRAR_INICIAL = 10;
const MAPA_DELTA = 0.006; // medio lado del encuadre (~600 m)

function urlMapa(coords) {
  const { lat, lng } = coords;
  const bbox = `${lng - MAPA_DELTA},${lat - MAPA_DELTA},${lng + MAPA_DELTA},${lat + MAPA_DELTA}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export default function RestaurantDetail({ restaurant, onClose }) {
  const [verTodas, setVerTodas] = useState(false);
  const media = restaurant.media;
  const resenas = restaurant.resenas ?? [];
  const visibles = verTodas ? resenas : resenas.slice(0, MOSTRAR_INICIAL);
  const mapaUrl = restaurant.coords
    ? `https://www.openstreetmap.org/?mlat=${restaurant.coords.lat}&mlon=${restaurant.coords.lng}#map=16/${restaurant.coords.lat}/${restaurant.coords.lng}`
    : null;

  function cerrarDesdeFondo(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-fondo" onClick={cerrarDesdeFondo}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="detalle-titulo" style={{ '--acento': restaurant.acento }}>
        <button type="button" className="modal-cerrar" onClick={onClose} aria-label="Cerrar detalle" autoFocus>
          ✕
        </button>
        <div className="modal-grid">
          <div className="modal-info">
            <img className="modal-foto" src={restaurant.imagen} alt={`${restaurant.nombre} — cocina ${restaurant.cocina}`} />
            <div className="modal-cuerpo">
              <p className="card-meta">{restaurant.cocina}</p>
              <h2 id="detalle-titulo" className="modal-titulo">{restaurant.nombre}</h2>
              {(restaurant.categorias?.length > 1) && (
                <ul className="modal-chips" aria-label="Especialidades">
                  {restaurant.categorias.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}
              <dl className="modal-datos">
                <div>
                  <dt>Nota Yelp</dt>
                  <dd>★ {restaurant.valoracion.toLocaleString('es-ES')} ({restaurant.totalResenasYelp ?? 0} reseñas)</dd>
                </div>
                {media != null && (
                  <div>
                    <dt>Nota MIRA (50 reseñas)</dt>
                    <dd>★ {media.toLocaleString('es-ES')}</dd>
                  </div>
                )}
                <div>
                  <dt>Precio</dt>
                  <dd>{restaurant.precio}</dd>
                </div>
                {restaurant.direccion && (
                  <div>
                    <dt>Dirección</dt>
                    <dd>{restaurant.direccion}</dd>
                  </div>
                )}
                {restaurant.telefono && (
                  <div>
                    <dt>Teléfono</dt>
                    <dd><a href={`tel:${restaurant.telefono.replace(/\s/g, '')}`}>{restaurant.telefono}</a></dd>
                  </div>
                )}
              </dl>
              <p className="modal-acciones">
                {mapaUrl && (
                  <a className="btn-secundario" href={mapaUrl} target="_blank" rel="noreferrer">
                    Cómo llegar
                  </a>
                )}
                {restaurant.yelpUrl && (
                  <a className="btn-secundario" href={restaurant.yelpUrl} target="_blank" rel="noreferrer">
                    Ver en Yelp
                  </a>
                )}
              </p>
              <h3 className="modal-sub">Reseñas de la comunidad ({resenas.length})</h3>
              {visibles.length === 0 && <p>Todavía no hay reseñas para este local.</p>}
              <ul className="modal-resenas">
                {visibles.map((r, i) => (
                  <li key={`${r.usuario}-${r.fecha}-${i}`}>
                    <p className="resena-cab">
                      <strong>{r.usuario}</strong> · {r.fecha} · <span aria-label={`${r.puntuacion} de 5`}>★ {r.puntuacion}</span>
                    </p>
                    <p className="resena-texto">{r.comentario}</p>
                  </li>
                ))}
              </ul>
              {resenas.length > MOSTRAR_INICIAL && (
                <button type="button" className="btn-secundario" onClick={() => setVerTodas((v) => !v)}>
                  {verTodas ? 'Ver menos' : `Ver las ${resenas.length} reseñas`}
                </button>
              )}
            </div>
          </div>
          <aside className="modal-mapa" aria-label={`Mapa de ${restaurant.nombre}`}>
            {restaurant.coords ? (
              <>
                <iframe
                  title={`Mapa con la ubicación de ${restaurant.nombre}`}
                  src={urlMapa(restaurant.coords)}
                  loading="lazy"
                />
                <p className="modal-mapa-pie">{restaurant.direccion || restaurant.ciudad}</p>
              </>
            ) : (
              <p className="modal-mapa-vacio">Este local no tiene coordenadas disponibles.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
