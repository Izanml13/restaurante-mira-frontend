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
} from '../models/restaurantModel.js';
import { Sellos, ConflictosAlergenos } from './Sellos.jsx';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';

const TRADS = { es, ca, en };

function PaginaSeccion({ seccion, dieta, mostrarConflictos, t }) {
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
                {mostrarConflictos && <ConflictosAlergenos alergenos={conflictos} />}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PaginaLeyenda({ leyenda, t }) {
  return (
    <div className="libro-pagina">
      <h4 className="libro-seccion-titulo">{t('libro.leyenda')}</h4>
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
  const t = useT(TRADS);
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
                  {libro.secciones.length} {t('libro.secciones')} · {totalPlatos} {t('libro.platos')}
                  {conDieta && ` · ${t('libro.aptosParaTi')}: ${aptos}`}
                  {restaurant.menuInfantil === true && ` · ${t('libro.menuInfantil')}`}
                </p>
        </div>
      );
    }
    if (pg.tipo === 'leyenda') {
      return <PaginaLeyenda key={i} leyenda={leyenda} t={t} />;
    }
    return <PaginaSeccion key={i} seccion={pg} dieta={dieta} mostrarConflictos={conDieta} t={t} />;
  }

  return (
    <div className="modal-fondo libro-fondo" onClick={cerrarDesdeFondo}>
      <div
        className="libro"
        role="dialog"
        aria-modal="true"
        aria-label={t('libro.cartaDe', { nombre: restaurant.nombre })}
        style={{ '--libro-fondo': tema.fondo, '--libro-tinta': tema.tinta, '--libro-acento': tema.acento }}
      >
        <button type="button" className="modal-cerrar" onClick={onClose} aria-label={t('libro.cerrarCarta')} autoFocus>
          ✕
        </button>
        <div className="libro-hojas">{visibles.map((i) => pintarPagina(i))}</div>
        <div className="libro-leyenda-barra" aria-label={t('libro.leyendaCarta')} role="note">
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
            {t('libro.anterior')}
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
            {t('libro.siguiente')}
          </button>
        </div>
      </div>
    </div>
  );
}
