/**
 * Avisos por distancia (G06) en la web: tarjetas flotantes abajo con el nivel
 * de oferta alcanzado. "Ver" abre la ficha del restaurante (#/r/<id>).
 */
import { useEffect } from 'react';
import useAvisosOfertas from '../hooks/useAvisosOfertas.js';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import '../styles/avisosOfertas.css';

const TRADS = { es, ca, en };
const DURACION_MS = 20_000;

function Aviso({ aviso, onCerrar, t }) {
  useEffect(() => {
    const id = setTimeout(onCerrar, DURACION_MS);
    return () => clearTimeout(id);
  }, [onCerrar]);

  const { restaurante, nivel, distanciaM } = aviso;
  const llegada = nivel.distancia === 20;
  return (
    <div className={`aviso-oferta${llegada ? ' es-llegada' : ''}`} role="status">
      <span className="aviso-oferta-icono" aria-hidden="true">{llegada ? '📍' : '🎯'}</span>
      <div className="aviso-oferta-texto">
        <strong>{restaurante.nombre}</strong>
        <span>{nivel.texto}</span>
        <small>{llegada ? t('ofertasCerca.llegada') : t('ofertasCerca.aDistancia', { m: distanciaM })}</small>
      </div>
      <a className="aviso-oferta-ver" href={`#/r/${encodeURIComponent(restaurante.id)}`} onClick={onCerrar}>
        {t('ofertasCerca.ver')}
      </a>
      <button type="button" className="aviso-oferta-cerrar" onClick={onCerrar} aria-label={t('ofertasCerca.cerrar')}>✕</button>
    </div>
  );
}

export default function AvisosOfertas() {
  const t = useT(TRADS);
  const { avisos, descartar } = useAvisosOfertas();
  if (!avisos.length) return null;
  return (
    <div className="avisos-ofertas" aria-live="polite">
      {avisos.map((a) => (
        <Aviso key={`${a.restaurante.id}:${a.nivel.distancia}`} aviso={a} onCerrar={() => descartar(a)} t={t} />
      ))}
    </div>
  );
}
