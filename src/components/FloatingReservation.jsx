/**
 * Floating reservation bottom sheet — slides up when a time slot is selected.
 */
import { useEffect, useRef } from 'react';

export default function FloatingReservation({ visible, restaurant, reserva, onConfirm, onClose }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    function alTeclar(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', alTeclar);
    return () => window.removeEventListener('keydown', alTeclar);
  }, [visible, onClose]);

  if (!restaurant || !reserva) return null;

  const comensales = parseInt(reserva.comensales, 10) || 2;
  const ahorroPct = reserva.ahorro || 0;
  const precioBase = comensales * 18;
  const ahorro = Math.round(precioBase * ahorroPct / 100);
  const total = precioBase - ahorro;

  return (
    <div
      className={`floating-sheet-overlay${visible ? ' visible' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-hidden={!visible}
    >
      <div className="floating-sheet" ref={sheetRef} role="dialog" aria-label="Confirmar reserva">
        <div className="floating-sheet-handle" />
        <h3 className="floating-sheet-title">{restaurant.nombre}</h3>
        <p className="floating-sheet-meta">
          {reserva.fecha} · {reserva.hora} · {comensales} {comensales === 1 ? 'persona' : 'personas'}
        </p>
        <div className="floating-sheet-details">
          <div className="floating-sheet-row">
            <span>Reserva</span>
            <span>{comensales} × 18 €</span>
          </div>
          {ahorroPct > 0 && (
            <div className="floating-sheet-row" style={{ color: 'var(--primary-container)' }}>
              <span>Descuento Epicure</span>
              <span>-{ahorro} €</span>
            </div>
          )}
          <div className="floating-sheet-row floating-sheet-total">
            <span>Total estimado</span>
            <span>{total} €</span>
          </div>
        </div>
        <button type="button" className="btn-cta floating-sheet-btn" onClick={onConfirm}>
          Confirmar Reserva
        </button>
      </div>
    </div>
  );
}
