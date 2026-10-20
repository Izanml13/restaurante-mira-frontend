/**
 * View pura — log de la conversación.
 * Lista semántica + región aria-live (patrón App.jsx:411).
 */
import { useEffect, useRef } from 'react';
import MiraBurbuja from './MiraBurbuja.jsx';
import MiraAcciones from './MiraAcciones.jsx';
import { useT } from '../../i18n/index.jsx';
import es from '../../i18n/es.js';
import ca from '../../i18n/ca.js';
import en from '../../i18n/en.js';

const TRADS = { es, ca, en };

export default function MiraLog({ mensajes, escribiendo, alSugerir, onAbrirFicha }) {
  const t = useT(TRADS);
  const logRef = useRef(null);
  // Si el usuario ha subido a releer, no le movemos; si está abajo (o acaba de escribir), seguimos el chat.
  const pegadoAbajo = useRef(true);

  function alDesplazar() {
    const el = logRef.current;
    if (el) pegadoAbajo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const ultimo = mensajes[mensajes.length - 1];
    if (pegadoAbajo.current || ultimo?.role === 'user') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      pegadoAbajo.current = true;
    }
  }, [mensajes, escribiendo]);

  return (
    <div className="mira-log" role="log" aria-live="polite" aria-busy={escribiendo} ref={logRef} onScroll={alDesplazar}>
      {mensajes.map((m) => (
        <div key={m.id} style={{ display: 'contents' }}>
          {m.content ? <MiraBurbuja rol={m.role}>{m.id === 'm-saludo' ? t('mira.saludo') : m.content}</MiraBurbuja> : null}
          {m.acciones ? (
            <MiraAcciones
              acciones={m.acciones}
              alSugerir={alSugerir}
              onAbrirFicha={onAbrirFicha}
            />
          ) : null}
        </div>
      ))}

      {escribiendo && (
        <div className="mira-burbuja mira-burbuja--model mira-escribiendo">
          <span />
          <span />
          <span />
          <span className="sr-only">{t('mira.escribiendo')}</span>
        </div>
      )}
    </div>
  );
}