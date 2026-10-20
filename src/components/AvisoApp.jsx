/**
 * Aviso de la portada en móvil: "MIRA tiene app" → #/app.
 * No sale en escritorio (CSS), con la web ya instalada ni si se ha cerrado antes.
 */
import { useState } from 'react';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import '../styles/descargar.css';

const TRADS = { es, ca, en };
const LS_CERRADO = 'mira:avisoAppCerrado';

function debeMostrarse() {
  try {
    if (window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone) return false;
    return localStorage.getItem(LS_CERRADO) !== '1';
  } catch {
    return true;
  }
}

export default function AvisoApp() {
  const t = useT(TRADS);
  const [visible, setVisible] = useState(debeMostrarse);
  if (!visible) return null;

  function cerrar() {
    try { localStorage.setItem(LS_CERRADO, '1'); } catch { /* sin storage */ }
    setVisible(false);
  }

  return (
    <aside className="aviso-app" aria-label={t('app.ojo')}>
      <img src="/icons/icon-192.png" alt="" width="40" height="40" />
      <div className="aviso-app-texto">
        <strong>{t('app.avisoTitulo')}</strong>
        <span>{t('app.avisoTexto')}</span>
      </div>
      <a className="aviso-app-boton" href="#/app">{t('app.avisoBoton')}</a>
      <button type="button" className="aviso-app-cerrar" onClick={cerrar} aria-label={t('app.avisoCerrar')}>✕</button>
    </aside>
  );
}
