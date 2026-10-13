import usePointsStore from '../../stores/usePointsStore.js';
import { useT } from '../../i18n/index.jsx';
import es from '../../i18n/es.js';
import ca from '../../i18n/ca.js';
import en from '../../i18n/en.js';

const TRADS = { es, ca, en };

// El balance lo carga el padre (PuntosDashboard/Cuenta) cuando hay sesión.
export default function BalanceCard() {
  const t = useT(TRADS);
  const { saldoActual, rachaLogin, rachaReservas, balanceLoading } = usePointsStore();

  if (balanceLoading) {
    return (
      <div className="balance-card balance-card--loading">
        <div className="balance-skeleton" />
      </div>
    );
  }

  return (
    <div className="balance-card">
      <div className="balance-card__header">
        <h3>{t('ui.misPuntos')}</h3>
        <img src="/moneda-mira.png" alt="MIRA Points" className="balance-card__coin" />
      </div>
      <div className="balance-card__saldo">
        <span className="balance-card__amount">{saldoActual}</span>
        <span className="balance-card__label">{t('ui.puntosDisponibles')}</span>
      </div>
      <div className="balance-card__details">
        <div className="balance-card__detail">
          <span className="detail-label">{t('ui.rachaEntradas')}</span>
          <span className="detail-value">{rachaLogin.dias || 0} días</span>
        </div>
        {rachaReservas.semanasConsecutivas > 0 && (
          <div className="balance-card__detail">
            <span className="detail-label">{t('ui.multiplicador')}</span>
            <span className="detail-value detail-value--highlight">x{rachaReservas.multiplicador}</span>
          </div>
        )}
      </div>
      <div className="balance-card__footer">
        <span className="balance-card__rate">{t('ui.equivalencia')}</span>
      </div>
    </div>
  );
}
