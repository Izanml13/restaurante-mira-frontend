/**
 * View pura: carta estilo libro (modal). Portada temática por cocina +
 * páginas (doble en desktop, simple en móvil), botones, flechas y Escape.
 * Todo por props; la carta y el tema los calcula el Model.
 */
import { useEffect, useMemo, useState } from 'react';
import { cartaLibro, temaCarta, dietaActiva, aptosEnCarta } from '../models/restaurantModel.js';

function Sellos({ plato }) {
  return (
    <span className="plato-sellos">
      {plato.vegano && (
        <span className="sello sello-vegano" title="Vegano">
          🌱
        </span>
      )}
      {!plato.vegano && plato.vegetariano && (
        <span className="sello sello-veg" title="Vegetariano">
          VG
        </span>
      )}
      {plato.sinGluten && (
        <span className="sello sello-sg" title="Sin gluten">
          SG
        </span>
      )}
    </span>
  );
}

function PaginaSeccion({ seccion, dieta, mostrarConflictos }) {
  return (
    <div className="libro-pagina">
      <h4 className="libro-seccion-titulo">{seccion.titulo}</h4>
      <ul className="libro-platos">
        {seccion.platos.map((p) => {
          const conflictos = (dieta?.alergias || []).filter((a) => p.alergenos.includes(a));
          return (
            <li key={p.nombre} className="libro-plato">
              <div className="libro-plato-cab">
                <strong>{p.nombre}</strong>
                <span className="libro-precio">{p.precio} €</span>
              </div>
              <p className="libro-plato-desc">
                {p.descripcion} <em>({p.cantidad})</em>
              </p>
              <p className="libro-plato-tags">
                <Sellos plato={p} />
                {mostrarConflictos && conflictos.length > 0 && (
                  <span className="plato-conflicto">contiene: {conflictos.join(', ')}</span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function LibroCarta({ restaurant, dieta, onClose }) {
  const [pagina, setPagina] = useState(0);
  const [doble, setDoble] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 720,
  );

  const libro = useMemo(() => cartaLibro(restaurant), [restaurant]);
  const tema = useMemo(() => temaCarta(restaurant.cocina), [restaurant.cocina]);
  const conDieta = dietaActiva(dieta);
  const aptos = conDieta ? aptosEnCarta(restaurant, dieta) : null;
  const totalPlatos = libro.secciones.reduce((n, s) => n + s.platos.length, 0);
  // Página 0 = portada; el resto, secciones.
  const paginas = useMemo(() => [{ tipo: 'portada' }, ...libro.secciones.map((s) => ({ tipo: 'seccion', ...s }))], [libro]);
  const maxInicio = paginas.length - 1;
  const inicio = Math.min(pagina, maxInicio);
  const visibles = doble ? [inicio, inicio + 1].filter((i) => i <= maxInicio) : [inicio];

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 720px)');
    function alCambiar(e) {
      setDoble(e.matches);
    }
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  useEffect(() => {
    function alTeclar(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setPagina((p) => Math.min(p + 1, maxInicio));
      if (e.key === 'ArrowLeft') setPagina((p) => Math.max(p - 1, 0));
    }
    window.addEventListener('keydown', alTeclar);
    return () => window.removeEventListener('keydown', alTeclar);
  }, [onClose, maxInicio]);

  function cerrarDesdeFondo(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-fondo libro-fondo" onClick={cerrarDesdeFondo}>
      <div
        className="libro"
        role="dialog"
        aria-modal="true"
        aria-label={`Carta de ${restaurant.nombre}`}
        style={{ '--libro-fondo': tema.fondo, '--libro-tinta': tema.tinta, '--libro-acento': tema.acento }}
      >
        <button type="button" className="modal-cerrar" onClick={onClose} aria-label="Cerrar carta" autoFocus>
          ✕
        </button>
        <div className="libro-hojas">
          {visibles.map((i) =>
            paginas[i].tipo === 'portada' ? (
              <div key={i} className="libro-pagina libro-portada">
                <p className="libro-portada-tema">{tema.nombre}</p>
                <h3 className="libro-portada-titulo">{restaurant.nombre}</h3>
                <p className="libro-portada-sub">
                  {restaurant.cocina} · {restaurant.precio}
                </p>
                <p className="libro-portada-datos">
                  {libro.secciones.length} secciones · {totalPlatos} platos
                  {conDieta && ` · Aptos para ti: ${aptos}`}
                </p>
              </div>
            ) : (
              <PaginaSeccion key={i} seccion={paginas[i]} dieta={dieta} mostrarConflictos={conDieta} />
            ),
          )}
        </div>
        <div className="libro-nav">
          <button
            type="button"
            className="btn-secundario btn-peq"
            disabled={inicio <= 0}
            onClick={() => setPagina((p) => Math.max(p - 1, 0))}
          >
            ← Anterior
          </button>
          <span className="libro-paginacion" aria-live="polite">
            {inicio + 1} / {paginas.length}
          </span>
          <button
            type="button"
            className="btn-secundario btn-peq"
            disabled={inicio >= maxInicio}
            onClick={() => setPagina((p) => Math.min(p + 1, maxInicio))}
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
