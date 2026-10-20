/**
 * Estadísticas de ofertas (G07): tarjetas KPI + barras de avisos por nivel +
 * línea por día (avisos, visitas, confirmadas). Se monta en el panel de
 * ofertas del dashboard (G04) con el restaurante activo.
 *
 * Props:
 *  - restauranteId (obligatorio): llama a GET /v1/ofertas/estadisticas con
 *    los últimos 30 días. Sin datos → «sin datos»; con error → mensaje y
 *    botón de reintentar (nunca se muestran cifras inventadas).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, Legend,
} from "recharts";
import { GlassTooltip } from "../ops/OpsCharts.jsx";
import { api } from "../../services/httpClient.js";
import { useT } from "../../i18n/index.jsx";
import { aSeriesNivel, aSeriesFechas, resumen } from "../../models/ofertasStatsModel.js";
import es from "../../i18n/es.js";
import ca from "../../i18n/ca.js";
import en from "../../i18n/en.js";

const TRADS = { es, ca, en };

const VERDE = "#0E6B47";
const ORO = "#E0A526";
const AZUL = "#2D6FD8";
const eje = { tickLine: false, axisLine: false, tick: { fontSize: 11, fill: "var(--chart-tick, #6f7a72)" } };

/** Fecha AAAA-MM-DD de hace `dias` (para el rango por defecto de la API). */
function haceDias(dias) {
  return new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);
}

const REFRESCO_MS = 15000;

export default function OfertasStats({ restauranteId }) {
  const t = useT(TRADS);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [activa, setActiva] = useState(null);

  const recargar = useCallback(async (silencioso = false) => {
    if (!restauranteId) { setDatos(null); setCargando(false); return; }
    if (!silencioso) setCargando(true);
    setError(false);
    try {
      const q = new URLSearchParams({
        restauranteId: String(restauranteId),
        desde: haceDias(30),
        hasta: new Date().toISOString().slice(0, 10),
      });
      setDatos(await api.get(`/v1/ofertas/estadisticas?${q}`));
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }, [restauranteId]);

  useEffect(() => { recargar(); }, [recargar]);

  // Se vuelve a pedir cada poco (sin parpadeo) para ver los cambios sin recargar.
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) recargar(true); }, REFRESCO_MS);
    return () => clearInterval(id);
  }, [recargar]);

  const serieNivel = useMemo(() => aSeriesNivel(datos), [datos]);
  const serieFecha = useMemo(() => aSeriesFechas(datos, t("modelos.locale")), [datos, t]);
  const kpi = useMemo(() => resumen(datos), [datos]);

  if (cargando) return <p className="vacio-texto">{t("otros.cargando")}</p>;
  if (error) {
    return (
      <div className="op-empty">
        <p className="ofertas-error" role="alert">{t("ofertasStats.errorCargar")}</p>
        <button type="button" className="op-btn-ghost" onClick={() => recargar()}>{t("ofertasStats.reintentar")}</button>
      </div>
    );
  }
  if (kpi.dias === 0) return <p className="vacio-texto">{t("ofertasStats.sinDatos")}</p>;

  return (
    <div className="dash-chart chart-anim">
      <h3 className="dash-chart-title">{t("ofertasStats.titulo")}</h3>

      <div className="dash-stats-grid" style={{ marginBottom: "0.75rem" }}>
        <div className="op-kpi-card">
          <div className="op-kpi-label">{t("ofertasStats.totalAvisos")}</div>
          <div className="op-kpi-value">{kpi.totalAvisos}</div>
        </div>
        <div className="op-kpi-card">
          <div className="op-kpi-label">{t("ofertasStats.totalVisitas")}</div>
          <div className="op-kpi-value">{kpi.totalVisitas}</div>
        </div>
        <div className="op-kpi-card">
          <div className="op-kpi-label">{t("ofertasStats.totalConfirmadas")}</div>
          <div className="op-kpi-value">{kpi.totalConfirmadas}</div>
        </div>
        <div className="op-kpi-card">
          <div className="op-kpi-label">{t("ofertasStats.tasa")}</div>
          <div className="op-kpi-value">
            {kpi.tasaLlegadas > 0 ? t("ofertasStats.tasaValor", { pct: Math.round(kpi.tasaLlegadas * 100) }) : "—"}
          </div>
        </div>
      </div>

      <h4 style={{ fontSize: "0.8rem", fontWeight: 700, margin: "0.5rem 0" }}>{t("ofertasStats.porNivel")}</h4>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={serieNivel} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
          onMouseLeave={() => setActiva(null)}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid, #e9eef5)" strokeDasharray="4 4" />
          <XAxis dataKey="nivel" {...eje} />
          <YAxis {...eje} allowDecimals={false} />
          <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(14,107,71,0.06)", radius: 8 }} />
          <Bar dataKey="avisos" name={t("ofertasStats.avisos")} fill={ORO} radius={[6, 6, 2, 2]} maxBarSize={44}
            animationDuration={800} onMouseEnter={(_, i) => setActiva(i)}>
            {serieNivel.map((_, i) => (
              <Cell key={i} fill={ORO} style={{ opacity: activa == null || activa === i ? 1 : 0.45, transition: "opacity 160ms ease" }} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <h4 style={{ fontSize: "0.8rem", fontWeight: 700, margin: "0.75rem 0 0" }}>{t("ofertasStats.porFecha")}</h4>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={serieFecha} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid, #e9eef5)" strokeDasharray="4 4" />
          <XAxis dataKey="dia" {...eje} />
          <YAxis {...eje} allowDecimals={false} />
          <Tooltip content={<GlassTooltip />} cursor={{ stroke: VERDE, strokeDasharray: "3 3", strokeOpacity: 0.5 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="avisos" name={t("ofertasStats.avisos")} stroke={ORO} strokeWidth={2.5}
            dot={{ r: 3, fill: ORO }} animationDuration={900} />
          <Line type="monotone" dataKey="visitas" name={t("ofertasStats.visitas")} stroke={AZUL} strokeWidth={2.5}
            dot={{ r: 3, fill: AZUL }} animationDuration={900} />
          <Line type="monotone" dataKey="confirmadas" name={t("ofertasStats.confirmadas")} stroke={VERDE} strokeWidth={2.5}
            dot={{ r: 3, fill: VERDE }} animationDuration={900} />
        </LineChart>
      </ResponsiveContainer>

      <p style={{ fontSize: "0.68rem", color: "var(--op-on-variant)", marginTop: "0.4rem" }}>
        {t("ofertasStats.notaPrivacidad")}
      </p>
    </div>
  );
}
