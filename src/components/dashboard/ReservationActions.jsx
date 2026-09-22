import { useState } from "react";
import { dashboardApi } from "../../services/api.js";

export default function ReservationActions({ reserva, onStatusChange, t }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [precio, setPrecio] = useState(reserva.precioBase || "");

  async function handleAction(action, extra) {
    setLoading(true);
    setError("");
    try {
      if (action === "confirmar") {
        await dashboardApi.confirmAttendance(reserva.id, { precioBase: Number(precio) || 0 });
      } else if (action === "no_show") {
        await dashboardApi.markNoShow(reserva.id);
      } else if (action === "cancelar") {
        await dashboardApi.updateReservationStatus(reserva.id, "cancelada");
      } else if (action === "completar") {
        await dashboardApi.updateReservationStatus(reserva.id, "completada");
      }
      onStatusChange?.(reserva.id, action);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const estado = reserva.estado;
  const activa = estado === "pendiente" || estado === "confirmada";

  return (
    <div className="dash-reservation-actions">
      {error && <span className="dash-error">{error}</span>}
      {activa && (
        <div className="dash-precio-row">
          <label className="dash-label">{t("dashboard.precioBase")}</label>
          <input
            type="number"
            className="dash-input-sm"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder={t("dashboard.precioPlaceholder")}
          />
        </div>
      )}
      <div className="dash-action-buttons">
        {activa && (
          <>
            <button
              className="btn-cta btn-peq"
              onClick={() => handleAction("confirmar")}
              disabled={loading}
            >
              {t("dashboard.confirmarAsistencia")}
            </button>
            <button
              className="btn-secundario btn-peq"
              onClick={() => handleAction("no_show")}
              disabled={loading}
            >
              {t("dashboard.marcarNoShow")}
            </button>
            <button
              className="btn-secundario btn-peq"
              onClick={() => handleAction("cancelar")}
              disabled={loading}
              style={{ color: "#b44d3e" }}
            >
              {t("dashboard.cancelarReserva")}
            </button>
          </>
        )}
        {(estado === "completada" || estado === "no_show" || estado === "cancelada") && (
          <span className={`dash-estado-badge dash-estado-${estado}`}>
            {estado === "completada" ? t("dashboard.completada") : estado === "no_show" ? t("dashboard.noShow") : t("dashboard.cancelada")}
          </span>
        )}
      </div>
    </div>
  );
}
