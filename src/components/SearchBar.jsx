/**
 * View pura: barra de búsqueda con 1 input + 4 selects.
 * Todo el estado y las opciones vienen por props del Controller;
 * esta View no importa el Model directamente.
 */
export default function SearchBar({ filtros, opciones, hayFiltrosActivos, distanciaDisponible, onChange, onClear }) {
  function manejarEnvio(e) {
    // El filtrado ya es en vivo; el botón Buscar solo evita recargar la página.
    e.preventDefault();
  }

  return (
    <form role="search" aria-label="Buscar restaurantes" className="searchbar" onSubmit={manejarEnvio}>
      <div className="campo campo-texto">
        <label htmlFor="f-q">Nombre, cocina o plato</label>
        <input
          id="f-q"
          name="q"
          type="search"
          placeholder="Prueba con “sushi” o “México”…"
          autoComplete="off"
          value={filtros.q}
          onChange={(e) => onChange('q', e.target.value)}
        />
      </div>

      <div className="campo">
        <label htmlFor="f-precio">Precio</label>
        <select id="f-precio" name="precio" value={filtros.precio} onChange={(e) => onChange('precio', e.target.value)}>
          <option value="">Cualquiera</option>
          {opciones.precios.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="f-cocina">Cocina</label>
        <select id="f-cocina" name="cocina" value={filtros.cocina} onChange={(e) => onChange('cocina', e.target.value)}>
          <option value="">Todas</option>
          {opciones.cocinas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="f-zona">Zona</label>
        <select id="f-zona" name="zona" value={filtros.zona} onChange={(e) => onChange('zona', e.target.value)}>
          <option value="">Toda Cataluña</option>
          {opciones.zonas.map((z) => (
            <option key={z} value={z}>
              {z.replace(', Spain', '')}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="f-distancia">Distancia</label>
        <select
          id="f-distancia"
          name="distanciaMax"
          value={filtros.distanciaMax}
          disabled={!distanciaDisponible}
          title={distanciaDisponible ? undefined : 'Activa tu ubicación para filtrar por distancia'}
          onChange={(e) => onChange('distanciaMax', e.target.value)}
        >
          {opciones.distancias.map((d) => (
            <option key={String(d.value)} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="f-orden">Ordenar por</label>
        <select id="f-orden" name="orden" value={filtros.orden} onChange={(e) => onChange('orden', e.target.value)}>
          {opciones.ordenes.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div className="campo campo-acciones">
        <button type="submit" className="btn-cta">
          Buscar
        </button>
        <button type="button" className="btn-secundario" onClick={onClear} disabled={!hayFiltrosActivos}>
          Limpiar
        </button>
      </div>
    </form>
  );
}
