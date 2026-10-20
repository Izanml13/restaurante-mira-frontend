import { useT } from '../../i18n/index.jsx';
import es from '../../i18n/es.js';
import ca from '../../i18n/ca.js';
import en from '../../i18n/en.js';

const TRADS = { es, ca, en };

export default function PromoBadge({ promoActiva }) {
  const t = useT(TRADS);
  if (!promoActiva) return null;

  return (
    <div className="promo-badge">
      <span className="promo-badge__icon">⭐</span>
      <span className="promo-badge__text">{t('ui.promocionado')}</span>
      {promoActiva.puntosExtraPorReserva > 0 && (
        <span className="promo-badge__pts">+{promoActiva.puntosExtraPorReserva} pts</span>
      )}
    </div>
  );
}
