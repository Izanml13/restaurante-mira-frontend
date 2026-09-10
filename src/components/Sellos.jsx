/**
 * View pura: insignias de dieta/alérgenos + mini-leyenda.
 * Compartida entre el libro y la carta plana del detalle.
 * Los textos vienen del catálogo (leyendaSellos): nada hardcodeado.
 */
import { leyendaSellos, codigoAlergeno } from '../models/restaurantModel.js';

export function Sellos({ plato }) {
  return (
    <span className="plato-sellos">
      {plato.vegano && (
        <span className="sello sello-vegano" title="Vegano">
          🌱<span className="sr-only">Vegano</span>
        </span>
      )}
      {!plato.vegano && plato.vegetariano && (
        <span className="sello sello-veg" title="Vegetariano">
          VG<span className="sr-only">Vegetariano</span>
        </span>
      )}
      {plato.sinGluten && (
        <span className="sello sello-sg" title="Sin gluten">
          SG<span className="sr-only">Sin gluten</span>
        </span>
      )}
    </span>
  );
}

export function ConflictosAlergenos({ alergenos }) {
  const lista = alergenos || [];
  if (!lista.length) return null;
  return (
    <span className="plato-conflictos">
      {lista.map((a) => (
        <span key={a} className="mini-sello" title={a}>
          {codigoAlergeno(a)}
          <span className="sr-only">{a}</span>
        </span>
      ))}
    </span>
  );
}

/** Mini-leyenda de una línea (sellos de dieta) para listas compactas. */
export function MiniLeyenda() {
  const items = leyendaSellos().slice(0, 3);
  return (
    <p className="mini-leyenda" aria-label="Leyenda de sellos">
      {items.map((e, i) => (
        <span key={e.nombre}>
          {i > 0 && ' · '}
          <strong aria-hidden="true">{e.simbolo}</strong> {e.nombre}
        </span>
      ))}
    </p>
  );
}
