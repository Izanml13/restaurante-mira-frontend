import { useState, useRef } from "react";
import { dashboardApi } from "../../services/api.js";

export default function TicketUpload({ reserva, onUploaded, t }) {
  const [precio, setPrecio] = useState(reserva.totalPagado || "");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRef = useRef();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!precio || Number(precio) <= 0) {
      setError(t("dashboard.precioRequerido"));
      return;
    }
    setUploading(true);
    setError("");
    try {
      await dashboardApi.confirmAttendance(reserva.id, {
        precioBase: Number(precio),
      });
      setSuccess(true);
      onUploaded?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  if (success) {
    return (
      <div className="dash-ticket-success">
        {t("dashboard.ticketSubido")}
      </div>
    );
  }

  return (
    <form className="dash-ticket-form" onSubmit={handleSubmit}>
      <div className="dash-ticket-header">
        <strong>{reserva.nombreRestaurante || t("dashboard.reserva")}</strong>
        <span className="dash-ticket-codigo">{reserva.codigo}</span>
      </div>
      <div className="dash-ticket-row">
        <span>{reserva.fecha} {reserva.hora} · {reserva.comensales} pax</span>
      </div>
      <div className="dash-precio-row">
        <label className="dash-label">{t("dashboard.precioTotal")}</label>
        <input
          ref={inputRef}
          type="number"
          className="dash-input-sm"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          placeholder={t("dashboard.precioPlaceholder")}
          step="0.01"
          min="0"
        />
        <span className="dash-currency">EUR</span>
      </div>
      <div className="dash-file-row">
        <input
          type="file"
          ref={inputRef}
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0])}
          className="dash-file-input"
        />
        {file && <span className="dash-file-name">{file.name}</span>}
      </div>
      {error && <span className="dash-error">{error}</span>}
      <button
        type="submit"
        className="btn-cta btn-peq"
        disabled={uploading}
      >
        {uploading ? t("otros.cargando") : t("dashboard.subirTicket")}
      </button>
    </form>
  );
}
