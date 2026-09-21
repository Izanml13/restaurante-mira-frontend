import { useEffect, useState } from 'react';
import usePointsStore from '../../stores/usePointsStore.js';

const TIPO_LABELS = {
  reserva: 'Reserva completada',
  login_diario: 'Login diario',
  racha_reserva_bonus: 'Bonus racha semanal',
  resena: 'Reseña',
  promo_view: 'Vista restaurante promocionado',
  promo_click: 'Click restaurante promocionado',
  invitacion: 'Invitación aceptada',
  canje_descuento: 'Canje de puntos',
  ajuste_admin: 'Ajuste admin',
};

const TIPO_COLORS = {
  reserva: '#2e7d32',
  login_diario: '#1565c0',
  racha_reserva_bonus: '#e65100',
  resena: '#6a1b9a',
  promo_view: '#00838f',
  promo_click: '#00838f',
  invitacion: '#f57f17',
  canje_descuento: '#c62828',
  ajuste_admin: '#616161',
};

export default function LedgerTable({ limit = 10, showFilters = false }) {
  const { ledger, fetchLedger, ledgerLoading } = usePointsStore();
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    fetchLedger({ tipo: filtro || undefined, limit });
  }, [filtro, limit]);

  if (ledgerLoading) {
    return <div className="ledger-loading">Cargando historial...</div>;
  }

  return (
    <div className="ledger-table">
      {showFilters && (
        <div className="ledger-filters">
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todos</option>
            <option value="reserva">Reservas</option>
            <option value="login_diario">Login diario</option>
            <option value="resena">Reseñas</option>
            <option value="invitacion">Invitaciones</option>
            <option value="promo_view">Vistas promo</option>
            <option value="promo_click">Clicks promo</option>
            <option value="canje_descuento">Canjes</option>
          </select>
        </div>
      )}
      <table className="ledger-table__table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Puntos</th>
            <th>Saldo</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map((mov) => (
            <tr key={mov.id}>
              <td>
                <span
                  className="ledger-badge"
                  style={{ backgroundColor: TIPO_COLORS[mov.tipo] || '#666' }}
                >
                  {TIPO_LABELS[mov.tipo] || mov.tipo}
                </span>
              </td>
              <td className={`ledger-puntos ${mov.cantidad >= 0 ? 'positivo' : 'negativo'}`}>
                {mov.cantidad >= 0 ? '+' : ''}{mov.cantidad}
              </td>
              <td>{mov.saldoResultante}</td>
              <td>{new Date(mov.createdAt?.seconds ? mov.createdAt.seconds * 1000 : mov.createdAt).toLocaleDateString('es-ES')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {ledger.length === 0 && (
        <div className="ledger-empty">No hay movimientos todavía</div>
      )}
    </div>
  );
}
