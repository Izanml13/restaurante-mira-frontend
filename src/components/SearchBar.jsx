/**
 * View pura: barra de búsqueda con filtros tipo pills + búsqueda por texto.
 */
import { useEffect, useState } from 'react';
import { DIAS, FRANJAS } from '../models/restaurantModel.js';

export default function SearchBar({ filtros, opciones, hayFiltrosActivos, onChange, onClear }) {
  const [qLocal, setQLocal] = useState(filtros.q);
  const [plegado, setPlegado] = useState(() => window.innerWidth < 768);

  useEffect(() => setQLocal(filtros.q), [filtros.q]);

  function buscarSiEnter(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (qLocal !== filtros.q) onChange('q', qLocal);
    }
  }

  function manejarEnvio(e) { e.preventDefault(); }

  return (
    <form role="search" aria-label="Buscar restaurantes" className={`searchbar${plegado ? ' plegada' : ''}`} onSubmit={manejarEnvio}>
      <div className="campo campo-texto">
        <label htmlFor="f-q">Buscar por nombre</label>
        <div style={{ position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gris)" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input
            id="f-q"
            name="q"
            type="search"
            placeholder="Busca por nombre, ej: Sushi Nami…"
            autoComplete="off"
            value={qLocal}
            onChange={(e) => setQLocal(e.target.value)}
            onKeyDown={buscarSiEnter}
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>
      </div>

      <button
        type="button"
        className="filtros-toggle"
        aria-expanded={!plegado}
        aria-controls="filtros-plegables"
        onClick={() => setPlegado((v) => !v)}
      >
        {plegado ? 'Mostrar filtros' : 'Ocultar filtros'}
      </button>

      <div className="filtros-plegables" id="filtros-plegables">
        <div className="campo">
          <label htmlFor="f-precio">Precio</label>
          <select id="f-precio" name="precio" value={filtros.precio} onChange={(e) => onChange('precio', e.target.value)}>
            <option value="">Cualquiera</option>
            {opciones.precios.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="f-cocina">Cocina</label>
          <select id="f-cocina" name="cocina" value={filtros.cocina} onChange={(e) => onChange('cocina', e.target.value)}>
            <option value="">Todas</option>
            {opciones.cocinas.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="f-zona">Zona</label>
          <select id="f-zona" name="zona" value={filtros.zona} onChange={(e) => onChange('zona', e.target.value)}>
            <option value="">Toda Cataluña</option>
            {opciones.zonas.map((z) => (
              <option key={z} value={z}>{z.replace(', Spain', '')}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="f-distancia">Distancia al centro</label>
          <select
            id="f-distancia"
            name="distanciaMax"
            value={filtros.distanciaMax}
            onChange={(e) => onChange('distanciaMax', e.target.value)}
          >
            {opciones.distancias.map((d) => (
              <option key={String(d.value)} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="f-dia">Día</label>
          <select id="f-dia" name="dia" value={filtros.dia} onChange={(e) => onChange('dia', e.target.value)}>
            <option value="">Cualquier día</option>
            {DIAS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="f-franja">Franja horaria</label>
          <select id="f-franja" name="franja" value={filtros.franja} onChange={(e) => onChange('franja', e.target.value)}>
            {FRANJAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="f-hora">Hora</label>
          <input id="f-hora" type="time" value={filtros.hora} onChange={(e) => onChange('hora', e.target.value)} />
        </div>

        <div className="campo">
          <label htmlFor="f-orden">Ordenar por</label>
          <select id="f-orden" name="orden" value={filtros.orden} onChange={(e) => onChange('orden', e.target.value)}>
            {opciones.ordenes.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="campo campo-acciones">
        <button type="button" className="btn-secundario" onClick={onClear} disabled={!hayFiltrosActivos}>
          Limpiar filtros
        </button>
      </div>
    </form>
  );
}
