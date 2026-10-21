import { useEffect, useRef, useState } from 'react';
import { validarResolucion } from '../services/incidenciaResolucion.js';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import '../styles/resolverIncidencia.css';

const TRADS = { es, ca, en };

export default function ResolverIncidenciaModal({ onConfirmar, onCancelar }) {
  const t = useT(TRADS);
  const dialogo = useRef(null);
  const enviando = useRef(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const d = dialogo.current;
    d.showModal();
    return () => d.close();
  }, []);

  async function confirmar(e) {
    e.preventDefault();
    if (enviando.current) return;
    setError('');
    try {
      const datos = validarResolucion(Object.fromEntries(new FormData(e.currentTarget)));
      enviando.current = true;
      setGuardando(true);
      await onConfirmar(datos);
      onCancelar();
    } catch (err) {
      setError(err.message);
    } finally {
      enviando.current = false;
      setGuardando(false);
    }
  }

  return (
    <dialog ref={dialogo} className="resolver-dialogo" aria-labelledby="resolver-titulo"
      onCancel={(e) => { e.preventDefault(); if (!guardando) onCancelar(); }}>
      <form onSubmit={confirmar}>
        <h2 id="resolver-titulo">{t('admin.resolver')}</h2>
        {['propuestaResolucion', 'solucion', 'encargado'].map((campo) => (
          <label key={campo} htmlFor={`resolver-${campo}`}>
            {t(`admin.${campo}`)}
            {campo === 'encargado' ? (
              <input id={`resolver-${campo}`} name={campo} required maxLength={200} disabled={guardando} />
            ) : (
              <textarea id={`resolver-${campo}`} name={campo} required maxLength={4000} rows={3} disabled={guardando} />
            )}
          </label>
        ))}
        {error && <p role="alert" className="auth-error">{error}</p>}
        <div className="resolver-acciones">
          <button type="button" className="btn-secundario btn-cancelar" disabled={guardando} onClick={onCancelar}>{t('admin.cancelarResolucion')}</button>
          <button type="submit" className="btn-cta" disabled={guardando}>{t('admin.confirmarResolucion')}</button>
        </div>
      </form>
    </dialog>
  );
}
