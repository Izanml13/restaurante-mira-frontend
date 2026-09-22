import { useState, useEffect, useCallback } from 'react';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function calcularPuntosPorDia(dia) {
  if (dia >= 7) return 0;
  return Math.min(5 + 3 * Math.max(0, dia - 1), 15);
}

function createConfetti() {
  const colors = ['var(--primary-container)', '#FFC800', '#FF4B4B', '#10B981', '#F59E0B', '#3B82F6'];
  for (let i = 0; i < 40; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'streak-confetti';
    const size = Math.random() * 8 + 6;
    confetti.style.width = size + 'px';
    confetti.style.height = (size * 1.4) + 'px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = (window.innerWidth / 2 + (Math.random() * 400 - 200)) + 'px';
    confetti.style.top = (window.innerHeight / 2 + (Math.random() * 100 - 50)) + 'px';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(confetti);

    const velocityX = (Math.random() - 0.5) * 600;
    const velocityY = -Math.random() * 450 - 150;
    const rotationSpeed = (Math.random() - 0.5) * 720;
    let startTime = performance.now();
    const duration = 2200;

    function animateConfetti(time) {
      const elapsed = (time - startTime) / duration;
      if (elapsed < 1) {
        confetti.style.left = (window.innerWidth / 2 + velocityX * elapsed) + 'px';
        confetti.style.top = (window.innerHeight / 2 + velocityY * elapsed + 600 * elapsed * elapsed) + 'px';
        confetti.style.transform = `rotate(${rotationSpeed * elapsed}deg) scale(${1 - elapsed * 0.4})`;
        confetti.style.opacity = (1 - elapsed).toString();
        requestAnimationFrame(animateConfetti);
      } else {
        confetti.remove();
      }
    }
    requestAnimationFrame(animateConfetti);
  }
}

export default function DailyStreakPopup({ racha, saldo, yaReclamado, onClaim, onWheel, onClose }) {
  const [claimed, setClaimed] = useState(yaReclamado || false);
  const [showToast, setShowToast] = useState(false);
  const [animSaldo, setAnimSaldo] = useState(saldo || 0);
  const [isVisible, setIsVisible] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [lastPuntos, setLastPuntos] = useState(0);

  const dias = racha?.dias || 0;
  const diasDisplay = Math.max(dias, 1);
  const puntosHoy = calcularPuntosPorDia(diasDisplay);
  const esDia7 = dias >= 7;

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    if (!justClaimed) setAnimSaldo(saldo || 0);
  }, [saldo, justClaimed]);

  const handleClaim = useCallback(async () => {
    if (claimed) {
      if (esDia7) {
        onWheel?.();
      } else {
        try { await onClaim?.(); } catch {}
      }
      return;
    }
    if (esDia7) {
      onWheel?.();
      return;
    }
    setClaimed(true);
    setJustClaimed(true);
    try {
      const result = await onClaim?.();
      const nuevosPuntos = result?.puntos || 0;
      const nuevoSaldo = result?.nuevoSaldo;
      setLastPuntos(nuevosPuntos);
      if (nuevoSaldo != null) {
        setAnimSaldo(nuevoSaldo);
      } else if (nuevosPuntos > 0) {
        setAnimSaldo((prev) => prev + nuevosPuntos);
      }
      createConfetti();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    } catch {
      setClaimed(false);
      setJustClaimed(false);
    }
  }, [claimed, esDia7, onClaim, onWheel]);

  const handleClose = () => {
    onClose?.();
  };

  return (
    <div className={`streak-overlay ${isVisible ? 'streak-overlay--visible' : ''}`}>
      <div className={`streak-modal ${isVisible ? 'streak-modal--visible' : ''}`}>

        {/* Cintillo superior */}
        <div className="streak-modal__header">
          <div className="streak-modal__brand">
            <div className="streak-modal__brand-icon">
              <img src="/mira_logo_3_circular_lente.svg" alt="MIRA" className="streak-modal__brand-logo" />
            </div>
            <div>
              <span className="streak-modal__brand-name">MIRA Club</span>
              <span className="streak-modal__brand-sub">Recompensa Diaria</span>
            </div>
          </div>
          <button className="streak-modal__close" onClick={handleClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Hero con mascota */}
        <div className="streak-modal__hero">
          <div className="streak-sunburst" />
          <div className="streak-glow" />

          <div className="streak-modal__mascot-area">
            <div className="streak-modal__mascot">
              <img src="/mascota-racha.png" alt="Mascota MIRA" className="streak-modal__mascot-img" />
              <div className="streak-modal__speech">
                <span>🔥</span>
                <span>{esDia7 ? '¡Llegaste al día 7!' : justClaimed ? `¡Día ${Math.max(diasDisplay - 1, 1)} completado!` : '¡Racha imparable!'}</span>
                <div className="streak-modal__speech-arrow" />
              </div>
            </div>

            <div className="streak-modal__coin streak-modal__coin--left">
              <img src="/moneda-mira.png" alt="MIRA Points" />
            </div>
            <div className="streak-modal__coin streak-modal__coin--right">
              <img src="/moneda-mira.png" alt="MIRA Points" />
            </div>
          </div>

          <div className="streak-modal__titles">
            <div className="streak-modal__day-badge">
              <span>⚡</span> {dias === 0 ? 'BIENVENIDO' : esDia7 ? 'DÍA 7 COMPLETADO' : `DÍA ${diasDisplay} COMPLETADO`}
            </div>
            <h2 className="streak-modal__title">
              {dias === 0 ? (
                <>¡Bienvenido a <span className="streak-modal__fire">MIRA Club!</span> <span>🎉</span></>
              ) : esDia7 ? (
                <>¡Completaste la racha de 7 días! <span className="streak-modal__fire">🎉</span></>
              ) : (
                <>¡Llevas <span className="streak-modal__fire">{diasDisplay} Días <span>🔥</span></span> de Racha!</>
              )}
            </h2>
            <p className="streak-modal__subtitle">
              {dias === 0 ? (
                <>Reclama tu primera recompensa y empieza a acumular <strong>MIRA Points</strong></>
              ) : esDia7 ? (
                <>Gira la ruleta para ganar entre <strong>20 y 100 MIRA Points</strong></>
              ) : (
                <>Entra a diario para desbloquear más <strong>MIRA Points</strong> y conseguir descuentos en tu próxima cena.</>
              )}
            </p>
          </div>
        </div>

        {/* Grid 7 días */}
        <div className="streak-modal__calendar">
          <div className="streak-modal__calendar-header">
            <div className="streak-modal__calendar-label">
              <span className="streak-modal__calendar-title">Camino del Foodie</span>
              <span className="streak-modal__calendar-week">· Semana 1</span>
            </div>
            {esDia7 && (
              <div className="streak-modal__calendar-prize">
                🎡 Ruleta: ¡hasta 100 MIRA pts!
              </div>
            )}
          </div>

          <div className="streak-grid">
            {Array.from({ length: 7 }, (_, i) => {
              const dia = i + 1;
              const completado = dia < diasDisplay || (dia === 7 && dias >= 7) || (dia === diasDisplay && claimed);
              const esHoy = dia === diasDisplay && !claimed;
              const puntos = dia === 7 ? null : calcularPuntosPorDia(dia);
              const bloqueado = dia > diasDisplay && !esHoy && !(dia === diasDisplay && claimed);

              return (
                <div
                  key={dia}
                  className={`streak-day ${completado ? 'streak-day--done' : ''} ${esHoy && !esDia7 ? 'streak-day--today' : ''} ${esHoy && esDia7 ? 'streak-day--wheel' : ''} ${bloqueado ? 'streak-day--locked' : ''}`}
                >
                  {esHoy && esDia7 && <div className="streak-day__tag">Hoy</div>}
                  <span className="streak-day__name">{DIAS_SEMANA[i]}</span>
                  <div className="streak-day__icon">
                    {completado && <span className="streak-day__check">✓</span>}
                    {!completado && esHoy && esDia7 && (
                      <img src="/racha-fuego.png" alt="Ruleta" className="streak-day__wheel-icon" />
                    )}
                    {!completado && esHoy && !esDia7 && (
                      <img src="/moneda-mira.png" alt="Moneda" className="streak-day__coin" />
                    )}
                    {bloqueado && <span className="streak-day__lock">🔒</span>}
                  </div>
                  {dia === 7 ? (
                    <span className="streak-day__points streak-day__points--wheel">🎡 Ruleta</span>
                  ) : (
                    <span className="streak-day__points">+{puntos}</span>
                  )}
                  <span className="streak-day__unit">MIRA</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Saldo + botón */}
        <div className="streak-modal__actions">
          <div className="streak-modal__balance">
            <div className="streak-modal__balance-icon">
              <img src="/moneda-mira.png" alt="" />
            </div>
            <div>
              <div className="streak-modal__balance-label">Tu saldo de MIRA Points</div>
              <div className="streak-modal__balance-amount">
                <span className="streak-modal__balance-num">{animSaldo}</span>
                <span className="streak-modal__balance-text">acumulados</span>
              </div>
            </div>
            <div className="streak-modal__balance-bar-wrap">
              <span className="streak-modal__balance-bar-label">{animSaldo} / 1.000 pts (10€ dto.)</span>
              <div className="streak-modal__balance-bar">
                <div className="streak-modal__balance-bar-fill" style={{ width: `${Math.min((animSaldo / 1000) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          <button
            className={`streak-claim-btn ${claimed ? 'streak-claim-btn--claimed' : ''} ${esDia7 ? 'streak-claim-btn--wheel' : ''}`}
            onClick={handleClaim}
            disabled={false}
          >
            {esDia7 ? (
              <>¡GIRAR RULETA! 🎡</>
            ) : claimed ? (
              <>VER RACHA ACTUAL ✓</>
            ) : (
              <>¡RECLAMAR +{puntosHoy} MIRA! ✨</>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="streak-modal__footer">
          <div className="streak-modal__footer-protect">
            <span>🛡️</span>
            <span>Protector de racha activo: si olvidas entrar mañana, tu racha no se pierde.</span>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`streak-toast ${showToast ? 'streak-toast--visible' : ''}`}>
        <div className="streak-toast__icon">✓</div>
        <div>
          <p className="streak-toast__title">+{lastPuntos || puntosHoy} MIRA Points acreditados</p>
          <p className="streak-toast__sub">¡Vuelve mañana para continuar tu racha!</p>
        </div>
      </div>
    </div>
  );
}
