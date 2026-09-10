/**
 * View pura: carta estilo libro (modal). Portada temática por cocina +
 * páginas (doble en desktop, simple en móvil) + página final de Leyenda.
 * Botones, flechas y Escape. Barra de leyenda siempre visible (sin hover).
 * Todo por props; la carta, el tema y la leyenda los calcula el Model.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  cartaLibro,
  temaCarta,
  dietaActiva,
  aptosEnCarta,
  leyendaSellos,
  codigoAlergeno,
} from '../models/restaurantModel.js';

function Sellos({ plato }) {
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

function Conflictos({ alergenos }) {
  if (!alergenos.length) return null;
  return (
    <span className="plato-conflictos">
      {alergenos.map((a) => (
        <span key={a} className="mini-sello" title={a}>
          {codigoAlergeno(a)}
          <span className="sr-only">{a}</span>
        </span>
      ))}
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
                {mostrarConflictos && <Conflictos alergenos={conflictos} />}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PaginaLeyenda({ leyenda }) {
  return (
    <div className="libro-pagina">
      <h4 className="libro-seccion-titulo">Leyenda</h4>
      <ul className="libro-leyenda-lista">
        {leyenda.map((e) => (
          <li key={e.nombre}>
            <span className="libro-leyenda-simbolo" aria-hidden="true">
              {e.simbolo}
            </span>
            <span>
              <strong>{e.nombre}.</strong> {e.descripcion}
            </span>
          </li>
        ))}
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
  const leyenda = useMemo(() => leyendaSellos(), []);
  const conDieta = dietaActiva(dieta);
  const aptos = conDieta ? aptosEnCarta(restaurant, dieta) : null;
  const totalPlatos = libro.secciones.reduce((n, s) => n + s.platos.length, 0);
  // Página 0 = portada, luego secciones y al final la Leyenda.
  const paginas = useMemo(
    () => [
      { tipo: 'portada' },
      ...libro.secciones.map((s) => ({ tipo: 'seccion', ...s })),
      { tipo: 'leyenda' },
    ],
    [libro],
  );
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

  function pintarPagina(i) {
    const pg = paginas[i];
    if (pg.tipo === 'portada') {
      return (
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
      );
    }
    if (pg.tipo === 'leyenda') {
      return <PaginaLeyenda key={i} leyenda={leyenda} />;
    }
    return <PaginaSeccion key={i} seccion={pg} dieta={dieta} mostrarConflictos={conDieta} />;
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
        <div className="libro-hojas">{visibles.map((i) => pintarPagina(i))}</div>
        <div className="libro-leyenda-barra" aria-label="Leyenda de la carta" role="note">
          {leyenda.map((e) => (
            <span key={e.nombre} className="libro-leyenda-item">
              <strong aria-hidden="true">{e.simbolo}</strong> {e.nombre}
            </span>
          ))}
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
