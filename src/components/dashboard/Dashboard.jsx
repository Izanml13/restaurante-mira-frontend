import { useState, useEffect } from "react";
import { dashboardApi } from "../../services/api.js";
import { proponerNegocio, listarMisNegocios } from "../../services/negocioApi.js";
import { RevenueLineChart, ReservationsPieChart, RevenueBarChart } from "./Charts.jsx";
import StatsCard from "./StatsCard.jsx";
import ReservationActions from "./ReservationActions.jsx";
import TicketUpload from "./TicketUpload.jsx";
import { useT } from "../../i18n/index.jsx";
import es from "../../i18n/es.js";
import ca from "../../i18n/ca.js";
import en from "../../i18n/en.js";

const TRADS = { es, ca, en };

const EMPTY_REST = {
  nombre: '', ciudad: '', zona: '', direccion: '', telefono: '', email: '',
  categorias: '', precio: '\u20AC\u20AC', descripcion: '', comisionPct: 10,
};

export default function Dashboard({ usuario, esAdmin, perfil }) {
  const t = useT(TRADS);

  if (esAdmin) {
    window.location.hash = '#/admin';
    return null;
  }

  const [tab, setTab] = useState("info");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noRestaurant, setNoRestaurant] = useState(false);
  const [pendingNegocio, setPendingNegocio] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRest, setNewRest] = useState({ ...EMPTY_REST });
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  const restTabs = ["info", "facturacion", "reservas", "tickets"];

  useEffect(() => {
    if (!usuario?.uid) return;
    let vivo = true;
    setLoading(true);
    dashboardApi.getMyRestaurant()
      .then(d => {
        if (vivo) {
          setData(d);
          setFormData(d.restaurante);
          setLoading(false);
        }
      })
      .catch(e => {
        if (vivo) {
          const msg = e.message || "Error al cargar";
          if (msg.includes("Restaurante no encontrado")) {
            listarMisNegocios(usuario.uid)
              .then(negocios => {
                if (!vivo) return;
                const pendiente = negocios.find(n => n.estado === "pendiente");
                if (pendiente) {
                  setPendingNegocio(pendiente);
                } else {
                  setNoRestaurant(true);
                }
                setLoading(false);
              })
              .catch(() => { if (vivo) { setNoRestaurant(true); setLoading(false); } });
          } else {
            setError(msg);
            setLoading(false);
          }
        }
      });
    return () => { vivo = false; };
  }, [usuario]);

  function handleEditChange(field, value) { setFormData(prev => ({ ...prev, [field]: value })); }

  async function handleSave() {
    setSaving(true); setError("");
    try {
      await dashboardApi.updateRestaurant(data.restaurante.id, formData);
      setData(prev => ({ ...prev, restaurante: { ...prev.restaurante, ...formData } }));
      setEditing(false);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  function handleReservationChange(reservaId, action) {
    setData(prev => {
      if (!prev) return prev;
      const newEstado = action === "confirmar" ? "completada" : action === "no_show" ? "no_show" : "cancelada";
      return { ...prev, proximasReservas: prev.proximasReservas.map(r => r.id === reservaId ? { ...r, estado: newEstado } : r) };
    });
  }

  async function handleAddPoints() {}

  async function handleCreateRestaurant(e) {
    e.preventDefault();
    setCreating(true); setError("");
    try {
      const categoriasArr = newRest.categorias.split(",").map(s => s.trim()).filter(Boolean);
      await proponerNegocio({
        usuario,
        datos: { ...newRest, categorias: categoriasArr },
      });
      setCreateSuccess(true);
      setTimeout(() => {
        setShowCreateForm(false);
        setCreateSuccess(false);
        setLoading(true);
        dashboardApi.getMyRestaurant()
          .then(d => { setData(d); setFormData(d.restaurante); setNoRestaurant(false); setLoading(false); })
          .catch(() => {
            listarMisNegocios(usuario.uid)
              .then(negocios => {
                const pendiente = negocios.find(n => n.estado === "pendiente");
                if (pendiente) { setPendingNegocio(pendiente); }
                else { setNoRestaurant(true); }
                setLoading(false);
              })
              .catch(() => { setNoRestaurant(true); setLoading(false); });
          });
      }, 2000);
    } catch (e) { setError(e.message); } finally { setCreating(false); }
  }

  if (loading) return <section className="auth-pagina"><div className="auth-tarjeta tarjeta-ancha"><p>{t("otros.cargando")}</p></div></section>;
  if (error && !data && !noRestaurant && !pendingNegocio) return <section className="auth-pagina"><div className="auth-tarjeta tarjeta-ancha"><h1>{t("dashboard.miRestaurante")}</h1><p className="auth-error">{error}</p></div></section>;
  if (!data && !noRestaurant && !pendingNegocio) return null;

  if (pendingNegocio) {
    return (
      <section className="auth-pagina pagina-ancha">
        <div className="auth-tarjeta tarjeta-ancha">
          <h1>{t("dashboard.miRestaurante")}</h1>
          <div style={{ background: "#fef3c7", color: "#92400e", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
            <p style={{ fontWeight: 700 }}>Tu propuesta esta pendiente de aprobacion</p>
            <p style={{ fontSize: "0.85rem", marginTop: "0.3rem" }}>
              <strong>{pendingNegocio.nombre}</strong> ({pendingNegocio.ciudad}) esta siendo revisada por un administrador.
              Te notificaremos cuando sea aprobada.
            </p>
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            <p><strong>Nombre:</strong> {pendingNegocio.nombre}</p>
            <p><strong>Ciudad:</strong> {pendingNegocio.ciudad}</p>
            <p><strong>Direccion:</strong> {pendingNegocio.direccion}</p>
            <p><strong>Cocina:</strong> {(pendingNegocio.categorias || []).join(", ")}</p>
            <p><strong>Precio:</strong> {pendingNegocio.precio}</p>
          </div>
        </div>
      </section>
    );
  }

  if (noRestaurant && !showCreateForm) {
    return (
      <section className="auth-pagina pagina-ancha">
        <div className="auth-tarjeta tarjeta-ancha">
          <h1>{t("dashboard.miRestaurante")}</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
            {"\u00A1"}Aun no tienes un restaurante registrado. Crea uno para empezar a gestionar reservas y facturacion.
          </p>
          <button className="btn-cta" onClick={() => setShowCreateForm(true)}>Crear mi restaurante</button>
        </div>
      </section>
    );
  }

  if (noRestaurant && showCreateForm) {
    return (
      <section className="auth-pagina pagina-ancha">
        <div className="auth-tarjeta tarjeta-ancha">
          <h1>Crear restaurante</h1>
          {createSuccess ? (
            <div style={{ background: "#d1fae5", color: "#065f46", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
              <p style={{ fontWeight: 700 }}>Restaurante creado correctamente</p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.3rem" }}>Tu propuesta esta pendiente de aprobacion por un administrador.</p>
            </div>
          ) : (
            <form onSubmit={handleCreateRestaurant} className="dash-form">
              {error && <p className="auth-error" role="alert">{error}</p>}
              <div className="dash-form-grid">
                <div className="dash-field"><label className="dash-label">Nombre *</label><input className="dash-input" value={newRest.nombre} onChange={e => setNewRest(p => ({ ...p, nombre: e.target.value }))} required /></div>
                <div className="dash-field"><label className="dash-label">Ciudad *</label><input className="dash-input" value={newRest.ciudad} onChange={e => setNewRest(p => ({ ...p, ciudad: e.target.value }))} required /></div>
                <div className="dash-field"><label className="dash-label">Zona *</label><input className="dash-input" value={newRest.zona} onChange={e => setNewRest(p => ({ ...p, zona: e.target.value }))} required /></div>
                <div className="dash-field"><label className="dash-label">Direccion *</label><input className="dash-input" value={newRest.direccion} onChange={e => setNewRest(p => ({ ...p, direccion: e.target.value }))} required /></div>
                <div className="dash-field"><label className="dash-label">Telefono</label><input className="dash-input" value={newRest.telefono} onChange={e => setNewRest(p => ({ ...p, telefono: e.target.value }))} /></div>
                <div className="dash-field"><label className="dash-label">Email</label><input className="dash-input" type="email" value={newRest.email} onChange={e => setNewRest(p => ({ ...p, email: e.target.value }))} /></div>
                <div className="dash-field"><label className="dash-label">Tipo de cocina *</label><input className="dash-input" value={newRest.categorias} onChange={e => setNewRest(p => ({ ...p, categorias: e.target.value }))} placeholder="Italiana, Mexicana..." required /></div>
                <div className="dash-field"><label className="dash-label">Rango de precio *</label><select className="dash-input" value={newRest.precio} onChange={e => setNewRest(p => ({ ...p, precio: e.target.value }))}><option value={'\u20AC'}>{'\u20AC'}</option><option value={'\u20AC\u20AC'}>{'\u20AC\u20AC'}</option><option value={'\u20AC\u20AC\u20AC'}>{'\u20AC\u20AC\u20AC'}</option></select></div>
              </div>
              <div className="dash-field"><label className="dash-label">Descripcion</label><textarea className="dash-input" rows="3" value={newRest.descripcion} onChange={e => setNewRest(p => ({ ...p, descripcion: e.target.value }))} /></div>
              <div className="dash-form-actions">
                <button type="submit" className="btn-cta btn-peq" disabled={creating}>{creating ? t("otros.cargando") : "Crear restaurante"}</button>
                <button type="button" className="btn-secundario btn-peq" onClick={() => { setShowCreateForm(false); setError(""); }}>Cancelar</button>
              </div>
            </form>
          )}
        </div>
      </section>
    );
  }

  const { restaurante, stats, proximasReservas, ingresosPorMes, ticketsRecientes } = data;
  const mesEntries = Object.entries(ingresosPorMes || {}).sort(([a], [b]) => a.localeCompare(b));
  const totalFacturacion = mesEntries.reduce((s, [, d]) => s + d.facturacion, 0);
  const totalComisiones = mesEntries.reduce((s, [, d]) => s + d.comisiones, 0);

  return (
    <section className="auth-pagina pagina-ancha">
      <div className="auth-tarjeta tarjeta-ancha">
        <div className="dash-header">
          <h1>{restaurante.nombre || t("dashboard.miRestaurante")}</h1>
          <span className={`dash-status ${restaurante.activo ? "dash-active" : "dash-inactive"}`}>{restaurante.activo ? t("dashboard.activo") : t("dashboard.inactivo")}</span>
        </div>
        <div className="tabs" role="tablist">
          {restTabs.map(k => (
            <button key={k} type="button" role="tab" aria-selected={tab === k}
              className={tab === k ? "btn-cta btn-peq" : "btn-secundario btn-peq"}
              onClick={() => setTab(k)}>
              {t(`dashboard.tab${k.charAt(0).toUpperCase() + k.slice(1)}`)}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="dash-tab-content">
            <div className="dash-stats-grid">
              <StatsCard icon={"\uD83D\uDCC5"} label={t("dashboard.reservasHoy")} value={stats.reservasHoy} color="dash-green" />
              <StatsCard icon={"\u2705"} label={t("dashboard.completadas")} value={stats.reservasCompletadas} color="dash-green" />
              <StatsCard icon={"\u23F3"} label={t("dashboard.pendientes")} value={stats.reservasPendientes} color="dash-gold" />
              <StatsCard icon={"\uD83D\uDEAB"} label={t("dashboard.noShows")} value={stats.reservasNoShow} color="dash-red" />
            </div>
            <div className="dash-form">
              <h3 className="dash-section-title">{t("dashboard.datosRestaurante")}</h3>
              <div className="dash-form-grid">
                {[["nombre", t("dashboard.nombre"), "text"], ["direccion", t("dashboard.direccion"), "text"], ["telefono", t("dashboard.telefono"), "tel"], ["email", t("dashboard.email"), "email"], ["ciudad", t("dashboard.ciudad"), "text"], ["precio", t("dashboard.rangoPrecio"), "text"], ["cocina", t("dashboard.tipoCocina"), "text"], ["comisionPct", t("dashboard.comisionPct"), "number"]].map(([field, label, type]) => (
                  <div key={field} className="dash-field">
                    <label className="dash-label">{label}</label>
                    {editing ? <input type={type} className="dash-input" value={formData[field] || ""} onChange={e => handleEditChange(field, e.target.value)} /> : <span className="dash-value">{restaurante[field] || "-"}</span>}
                  </div>
                ))}
                <div className="dash-field">
                  <label className="dash-label">{t("dashboard.activo")}</label>
                  {editing ? <select className="dash-input" value={formData.activo ? "si" : "no"} onChange={e => handleEditChange("activo", e.target.value === "si")}><option value="si">{t("dashboard.si")}</option><option value="no">{t("dashboard.no")}</option></select> : <span className={`dash-status ${restaurante.activo ? "dash-active" : "dash-inactive"}`}>{restaurante.activo ? t("dashboard.si") : t("dashboard.no")}</span>}
                </div>
              </div>
              <div className="dash-form-actions">
                {editing ? <><button className="btn-cta btn-peq" onClick={handleSave} disabled={saving}>{saving ? t("otros.cargando") : t("dashboard.guardar")}</button><button className="btn-secundario btn-peq" onClick={() => { setEditing(false); setFormData(restaurante); }}>{t("dashboard.cancelar")}</button></> : <button className="btn-secundario btn-peq" onClick={() => setEditing(true)}>{t("dashboard.editar")}</button>}
              </div>
            </div>
          </div>
        )}

        {tab === "facturacion" && (
          <div className="dash-tab-content">
            <div className="dash-stats-grid">
              <StatsCard icon={"\uD83D\uDCB0"} label={t("dashboard.totalFacturacion")} value={`${totalFacturacion.toFixed(2)}\u20AC`} color="dash-gold" />
              <StatsCard icon={"\uD83C\uDFE6"} label={t("dashboard.totalComisiones")} value={`${totalComisiones.toFixed(2)}\u20AC`} color="dash-red" />
              <StatsCard icon={"\uD83E\uDDFE"} label={t("dashboard.ticketPromedio")} value={`${stats.ticketPromedio}\u20AC`} color="dash-green" />
              <StatsCard icon={"\uD83D\uDCCB"} label={t("dashboard.totalTickets")} value={ticketsRecientes.length} color="dash-blue" />
            </div>
            <RevenueLineChart data={ingresosPorMes} title={t("dashboard.evolucionIngresos")} />
            <RevenueBarChart data={ingresosPorMes} title={t("dashboard.ticketsPorMes")} />
            <h3 className="dash-section-title">{t("dashboard.historialTickets")}</h3>
            <ul className="dash-list">
              {ticketsRecientes.map(ticket => (
                <li key={ticket.id} className="dash-list-item">
                  <span><strong>{ticket.restaurantName || "-"}</strong> . {ticket.codigoReserva || "-"}</span>
                  <span>{ticket.totalPagado?.toFixed(2) || 0}\u20AC . {ticket.fecha || "-"}</span>
                </li>
              ))}
              {ticketsRecientes.length === 0 && <li className="dash-empty">{t("dashboard.sinTickets")}</li>}
            </ul>
          </div>
        )}

        {tab === "reservas" && (
          <div className="dash-tab-content">
            <h3 className="dash-section-title">{t("dashboard.proximasReservas")} ({proximasReservas.length})</h3>
            <ul className="dash-reservation-list">
              {proximasReservas.map(r => (
                <li key={r.id} className="dash-reservation-item">
                  <div className="dash-reservation-info">
                    <strong>{r.usuarioNombre || r.usuarioEmail || t("dashboard.cliente")}</strong>
                    <span className="dash-reservation-meta">{r.fecha} {r.hora} . {r.comensales} pax . <code>{r.codigo}</code></span>
                    {r.comentarios && <span className="dash-reservation-comment">"{r.comentarios}"</span>}
                  </div>
                  <ReservationActions reserva={r} onStatusChange={handleReservationChange} t={t} />
                </li>
              ))}
              {proximasReservas.length === 0 && <li className="dash-empty">{t("dashboard.sinReservas")}</li>}
            </ul>
          </div>
        )}

        {tab === "tickets" && (
          <div className="dash-tab-content">
            <h3 className="dash-section-title">{t("dashboard.subirTicket")}</h3>
            <p className="dash-help-text">{t("dashboard.ticketHelp")}</p>
            <ul className="dash-reservation-list">
              {proximasReservas.filter(r => r.estado === "confirmada" || r.estado === "pendiente").map(r => (
                <li key={r.id} className="dash-reservation-item">
                  <TicketUpload reserva={r} onUploaded={() => handleReservationChange(r.id, "confirmar")} t={t} />
                </li>
              ))}
              {proximasReservas.filter(r => r.estado === "confirmada" || r.estado === "pendiente").length === 0 && <li className="dash-empty">{t("dashboard.sinReservasPendientes")}</li>}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
