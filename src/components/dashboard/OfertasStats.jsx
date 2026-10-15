/**
 * Estadísticas de ofertas (G07): tarjetas KPI + barras por nivel + línea por
 * fecha. Componente independiente de la sección «Ofertas» del dashboard.
 *
 * Props:
 *  - datos: forma de la API ({ porNivel, porFecha }, ver
 *    docs/coordenacion/CONTRATOS-ASUMIDOS.md). Si falta o está vacío se usa
 *    el mock local (`estadisticasMock`) hasta que exista el endpoint real.
 *  - cargando (bool, opcional) para mostrar placeholder.
 */
import { useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, Legend,
} from "recharts";
import { GlassTooltip } from "../ops/OpsCharts.jsx";
import { useT } from "../../i18n/index.jsx";
import { aSeriesNivel, aSeriesFechas, resumen, estadisticasMock } from "../../models/ofertasStatsModel.js";
import es from "../../i18n/es.js";
import ca from "../../i18n/ca.js";
import en from "../../i18n/en.js";

const TRADS = { es, ca, en };

const VERDE = "#0E6B47";
const ORO = "#E0A526";
const eje = { tickLine: false, axisLine: false, tick: { fontSize: 11, fill: "var(--chart-tick, #6f7a72)" } };

export default function OfertasStats({ datos, cargando }) {
  const t = useT(TRADS);
  const [activa, setActiva] = useState(null);

  const serieNivel = useMemo(() => aSeriesNivel(datos || estadisticasMock()), [datos]);
  const serieFecha = useMemo(() => aSeriesFechas(datos || estadisticasMock(), t("modelos.locale")), [datos, t]);
  const kpi = useMemo(() => resumen(datos || estadisticasMock()), [datos]);

  if (cargando) return <p className="vacio-texto">{t("otros.cargando")}</p>;
  if (serieNivel.every((n) => n.avisos === 0 && n.llegadas === 0)) {
    return <p className="vacio-texto">{t("ofertasStats.sinDatos")}</p>;
  }

  return (
    <div className="dash-chart chart-anim">
      <h3 className="dash-chart-title">{t("ofertasStats.titulo")}</h3>

      <div className="dash-stats-grid" style={{ marginBottom: "0.75rem" }}>
        <div className="op-kpi-card">
          <div className="op-kpi-label">{t("ofertasStats.totalAvisos")}</div>
          <div className="op-kpi-value">{kpi.totalAvisos}</div>
        </div>
        <div className="op-kpi-card">
          <div className="op-kpi-label">{t("ofertasStats.totalLlegadas")}</div>
          <div className="op-kpi-value">{kpi.totalLlegadas}</div>
        </div>
        <div className="op-kpi-card">
          <div className="op-kpi-label">{t("ofertasStats.tasa")}</div>
          <div className="op-kpi-value">
            {kpi.tasaLlegadas > 0 ? t("ofertasStats.tasaValor", { pct: Math.round(kpi.tasaLlegadas * 100) }) : "—"}
          </div>
        </div>
        <div className="op-kpi-card">
          <div className="op-kpi-label">{t("ofertasStats.mejorNivel")}</div>
          <div className="op-kpi-value">
            {kpi.mejorDistancia != null ? t("ofertasStats.nivelValor", { n: kpi.mejorDistancia }) : "—"}
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
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="avisos" name={t("ofertasStats.avisos")} fill={ORO} radius={[6, 6, 2, 2]} maxBarSize={36}
            animationDuration={800} onMouseEnter={(_, i) => setActiva(i)}>
            {serieNivel.map((_, i) => (
              <Cell key={i} fill={ORO} style={{ opacity: activa == null || activa === i ? 1 : 0.45, transition: "opacity 160ms ease" }} />
            ))}
          </Bar>
          <Bar dataKey="llegadas" name={t("ofertasStats.llegadas")} fill={VERDE} radius={[6, 6, 2, 2]} maxBarSize={36}
            animationDuration={800}>
            {serieNivel.map((_, i) => (
              <Cell key={i} fill={VERDE} style={{ opacity: activa == null || activa === i ? 1 : 0.45, transition: "opacity 160ms ease" }} />
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
          <Line type="monotone" dataKey="llegadas" name={t("ofertasStats.llegadas")} stroke={VERDE} strokeWidth={2.5}
            dot={{ r: 3, fill: VERDE }} animationDuration={900} />
        </LineChart>
      </ResponsiveContainer>

      <p style={{ fontSize: "0.68rem", color: "var(--op-on-variant)", marginTop: "0.4rem" }}>
        {t("ofertasStats.notaPrivacidad")}
      </p>
    </div>
  );
}
