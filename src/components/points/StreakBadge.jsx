export default function StreakBadge({ rachaLogin, rachaReservas }) {
  const dias = rachaLogin?.dias || 0;
  const multiplicador = rachaReservas?.multiplicador || 1;
  const semanas = rachaReservas?.semanasConsecutivas || 0;

  return (
    <div className="streak-badge">
      <div className="streak-badge__login">
        <span className="streak-badge__icon">🔥</span>
        <div className="streak-badge__info">
          <span className="streak-badge__value">{dias}</span>
          <span className="streak-badge__label">días login</span>
        </div>
      </div>
      {semanas > 0 && (
        <div className="streak-badge__reserva">
          <span className="streak-badge__icon">⭐</span>
          <div className="streak-badge__info">
            <span className="streak-badge__value">x{multiplicador}</span>
            <span className="streak-badge__label">{semanas} semana{semanas > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}
