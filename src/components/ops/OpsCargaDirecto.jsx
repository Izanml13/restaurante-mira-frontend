/**
 * OpsCargaDirecto — carga de la API en directo: peticiones por segundo,
 * latencia, errores, peticiones en curso, clientes activos y salud del proceso.
 * Los datos salen de la memoria de la API (/v1/metricas/directo): mirarlo no
 * consulta la base de datos. Solo pide datos mientras la pestaña está visible.
 */
import { useEffect, useRef, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { metricasApi } from '../../services/mejorasApi.js';
import { GlassTooltip } from './OpsCharts.jsx';
import { useT } from '../../i18n/index.jsx';
import es from '../../i18n/es.js';
import ca from '../../i18n/ca.js';
import en from '../../i18n/en.js';

const TRADS = { es, ca, en };

const INTERVALO_MS = 2000;
const VERDE = '#0e6b47';
const AZUL = '#2d6fd8';
const ORO = '#c9a227';
const ROJO = '#ba1a1a';
const VENTANAS = [[60, '1 min'], [300, '5 min']];

const fmt = (n, suf = '') => (n == null ? '—' : `${Number(n).toLocaleString('es-ES')}${suf}`);
const hora = (t) => new Date(t).toLocaleTimeString('es-ES', { minute: '2-digit', second: '2-digit' });

function Indicador({ etiqueta, valor, sub, tono = '' }) {
  return (
    <div className={`ops-kpi carga-kpi ${tono}`}>
      <span className="ops-kpi-label">{etiqueta}</span>
      <div className="ops-kpi-value">{valor}</div>
      {sub && <span className="carga-sub">{sub}</span>}
    </div>
  );
}

function Medidor({ etiqueta, valor, max, unidad, umbral }) {
  const pct = valor == null || !max ? 0 : Math.min(1, valor / max);
  const alto = umbral != null && valor != null && valor >= umbral;
  return (
    <div className="carga-medidor">
      <div className="carga-medidor-cab"><span>{etiqueta}</span><strong className={alto ? 'is-alto' : ''}>{fmt(valor)} {unidad}</strong></div>
      <span className="carga-medidor-pista"><i className={alto ? 'is-alto' : ''} style={{ transform: `scaleX(${pct})` }} /></span>
    </div>
  );
}

export default function OpsCargaDirecto() {
  const t = useT(TRADS);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [pausado, setPausado] = useState(false);
  const [ventana, setVentana] = useState(300);
  const pidiendo = useRef(false);

  useEffect(() => {
    if (pausado) return undefined;
    let vivo = true;
    async function pedir() {
      if (pidiendo.current || document.visibilityState !== 'visible') return;
      pidiendo.current = true;
      try {
        const d = await metricasApi.directo(ventana);
        if (vivo) { setDatos(d); setError(''); }
      } catch (e) {
        if (vivo) setError(e.message);
      } finally {
        pidiendo.current = false;
      }
    }
    pedir();
    const id = setInterval(pedir, INTERVALO_MS);
    return () => { vivo = false; clearInterval(id); };
  }, [pausado, ventana]);

  if (!datos) {
    return (
      <div className="ops-card" role={error ? 'alert' : 'status'}>
        <h2>{t('tx.cargaTitulo')}</h2>
        <p className={error ? 'ops-error' : 'ops-card-sub'}>{error || 'Conectando con la API…'}</p>
      </div>
    );
  }

  const r = datos.resumen;
  const s = datos.sistema;
  const serie = datos.serie.map((p) => ({ ...p, hora: hora(p.t), errores: p.e4 + p.e5 }));
  const uptime = s.uptimeS >= 3600 ? `${Math.floor(s.uptimeS / 3600)} h ${Math.floor((s.uptimeS % 3600) / 60)} min` : `${Math.floor(s.uptimeS / 60)} min`;

  return (
    <div className="carga">
      <div className="ops-card">
        <div className="ops-card-head">
          <div>
            <h2>
              {t('tx.cargaTitulo')} {!pausado && <span className="ops-live-chip"><i />{t('tx.cargaEnVivo')}</span>}
            </h2>
            <p className="ops-card-sub">{t('tx.cargaSub')}</p>
          </div>
          <div className="carga-controles">
            <div className="ops-seg" role="tablist" aria-label={t('tx.cargaVentana')}>
              {VENTANAS.map(([v, n]) => (
                <button key={v} type="button" role="tab" aria-selected={ventana === v} className={ventana === v ? 'active' : ''} onClick={() => setVentana(v)}>{n}</button>
              ))}
            </div>
            <button type="button" className="ops-btn soft sm" onClick={() => setPausado((p) => !p)}>
              <span className="material-symbols-outlined">{pausado ? 'play_arrow' : 'pause'}</span>{pausado ? 'Reanudar' : 'Pausar'}
            </button>
          </div>
        </div>
        {error && <p className="ops-error" role="alert">Sin conexión con la API: {error}. Se muestra el último dato.</p>}
        <div className="ops-kpis carga-kpis">
          <Indicador etiqueta={t('tx.cargaPeticionesS')} valor={fmt(r.rpsActual)} sub={t('tx.cargaMedia10')} />
          <Indicador etiqueta={t('tx.cargaLatencia')} valor={fmt(r.p95, ' ms')} sub={`p50 ${fmt(r.p50, ' ms')} · p99 ${fmt(r.p99, ' ms')}`} tono={r.p95 > 1000 ? 'is-alerta' : ''} />
          <Indicador etiqueta={t('tx.cargaPctErrores')} valor={r.pctErrores == null ? '—' : `${String(r.pctErrores).replace('.', ',')} %`} sub={`${fmt(r.errores4xx)} 4xx · ${fmt(r.errores5xx)} 5xx`} tono={r.errores5xx > 0 ? 'is-alerta' : ''} />
          <Indicador etiqueta={t('tx.cargaEnCurso')} valor={fmt(r.enCurso)} sub={t('tx.cargaAhora')} />
          <Indicador etiqueta={t('tx.cargaClientes')} valor={fmt(r.clientesActivos)} sub={t('tx.cargaUltimoMin')} />
          <Indicador etiqueta={t('tx.cargaPeticiones')} valor={fmt(r.peticiones)} sub={t('tx.cargaVentanaTotal', { n: fmt(r.totalDesdeArranque) })} />
        </div>
      </div>

      <div className="ops-grid-2">
        <div className="ops-card">
          <h3 className="carga-h3">{t('tx.cargaPeticionesSeg')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={serie} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
              <defs><linearGradient id="cargaRps" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={VERDE} stopOpacity={0.4} /><stop offset="100%" stopColor={VERDE} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="var(--chart-grid, #e3e9f5)" strokeDasharray="4 4" />
              <XAxis dataKey="hora" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--chart-tick, #6f7a72)' }} minTickGap={40} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--chart-tick, #6f7a72)' }} />
              <Tooltip content={<GlassTooltip />} />
              <Area type="monotone" dataKey="rps" name="Peticiones/s" stroke={VERDE} strokeWidth={2} fill="url(#cargaRps)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="ops-card">
          <h3 className="carga-h3">Latencia (ms)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={serie} margin={{ top: 8, right: 6, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid, #e3e9f5)" strokeDasharray="4 4" />
              <XAxis dataKey="hora" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--chart-tick, #6f7a72)' }} minTickGap={40} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--chart-tick, #6f7a72)' }} />
              <Tooltip content={<GlassTooltip unidades={{ p50: 'ms', p95: 'ms' }} />} />
              <Line type="monotone" dataKey="p50" name="p50" stroke={AZUL} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
              <Line type="monotone" dataKey="p95" name="p95" stroke={ORO} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ops-grid-2">
        <div className="ops-card">
          <h3 className="carga-h3">{t('tx.cargaErroresSeg')}</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={serie} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid, #e3e9f5)" strokeDasharray="4 4" />
              <XAxis dataKey="hora" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--chart-tick, #6f7a72)' }} minTickGap={40} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--chart-tick, #6f7a72)' }} />
              <Tooltip content={<GlassTooltip />} />
              <Bar dataKey="e4" name="4xx" stackId="e" fill={ORO} isAnimationActive={false} />
              <Bar dataKey="e5" name="5xx" stackId="e" fill={ROJO} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="ops-card">
          <h3 className="carga-h3">{t('tx.cargaSalud')} <small>Node {s.node} · {s.nucleos} núcleos · arrancado hace {uptime}</small></h3>
          <Medidor etiqueta={t('tx.cargaCpu')} valor={s.cpuPct} max={100} unidad="%" umbral={80} />
          <Medidor etiqueta={t('tx.cargaMemoria')} valor={s.memoriaMB} max={512} unidad="MB" umbral={450} />
          <Medidor etiqueta={t('tx.cargaHeap')} valor={s.heapMB} max={s.heapTotalMB || 1} unidad={`/ ${s.heapTotalMB} MB`} />
          <Medidor etiqueta={t('tx.cargaLag')} valor={s.lagMs} max={200} unidad={`ms (p99 ${s.lagP99Ms})`} umbral={100} />
        </div>
      </div>

      <div className="ops-card">
        <h3 className="carga-h3">{t('tx.cargaRutas')} <small>{t('tx.cargaDesdeArranque')}</small></h3>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead><tr><th>{t('tx.cargaRuta')}</th><th className="num">{t('tx.cargaPeticiones')}</th><th className="num">{t('tx.cargaErrores')}</th><th className="num">p95</th></tr></thead>
            <tbody>
              {datos.rutas.length === 0 && <tr><td colSpan="4" className="ops-empty">{t('tx.cargaSinTrafico')}</td></tr>}
              {datos.rutas.map((x) => (
                <tr key={x.ruta}>
                  <td><code className="ops-code">{x.ruta}</code></td>
                  <td className="num">{fmt(x.n)}</td>
                  <td className="num">{x.errores ? <span className="ops-pill warn">{fmt(x.errores)}</span> : '0'}</td>
                  <td className="num">{fmt(x.p95, ' ms')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ops-muted carga-nota">{t('tx.cargaNota')}</p>
      </div>
    </div>
  );
}
