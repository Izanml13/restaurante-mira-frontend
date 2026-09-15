/**
 * Panel lateral de parkings cercanos.
 * - Desktop: al lado del mapa (grid 1fr 320px)
 * - Móvil: debajo del mapa
 * - Click en tarjeta → centrar mapa (onSeleccionarParking)
 */

import { formatoDistancia } from '../services/parkingApi.js';

function SkeletonCard() {
  return (
    <div className="parking-skeleton" aria-hidden="true">
      <div className="parking-skeleton-bar parking-skeleton-nombre" />
      <div className="parking-skeleton-bar parking-skeleton-detalle" />
      <div className="parking-skeleton-bar parking-skeleton-detalle2" />
    </div>
  );
}

export default function ParkingsPanel({ parkings, cargando, onSeleccionarParking }) {
  return (
    <aside className="parkings-panel" aria-label="Parkings cercanos">
      <h3 className="parkings-panel-titulo">
        Parkings cercanos
        {!cargando && <span className="parkings-panel-cuenta">{parkings.length}</span>}
      </h3>

      {cargando && (
        <div className="parkings-panel-lista">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!cargando && parkings.length === 0 && (
        <p className="parkings-panel-vacio">Sin parkings a 500 m</p>
      )}

      {!cargando && parkings.length > 0 && (
        <ul className="parkings-panel-lista">
          {parkings.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                className="parking-card"
                onClick={() => onSeleccionarParking?.(i)}
                aria-label={`Ir a ${p.nombre}, ${formatoDistancia(p.distanciaMetros)}`}
              >
                <div className="parking-card-nombre">{p.nombre}</div>
                <div className="parking-card-meta">
                  <span className="parking-card-distancia">{formatoDistancia(p.distanciaMetros)}</span>
                  <span className="parking-card-sep">·</span>
                  <span>{p.gratuito === 'yes' ? '💰 Gratis' : '💰 Pago'}</span>
                  <span className="parking-card-sep">·</span>
                  <span>{p.accesible === 'Sí' ? '♿ Sí' : '♿ —'}</span>
                  <span className="parking-card-sep">·</span>
                  <span>{p.tipo !== '—' ? `🏢 ${p.tipo}` : '🏢 —'}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
