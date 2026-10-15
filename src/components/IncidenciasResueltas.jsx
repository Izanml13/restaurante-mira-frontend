import { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { calcularMetricas, filtrarResueltas, fechaIncidencia } from '../services/incidenciaMetricas.js';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import '../styles/incidencias.css';
const TRADS = { es, ca, en };

export default function IncidenciasResueltas({ lista }) {
  const t = useT(TRADS);
  const [filtros, setFiltros] = useState({ texto: '', desde: '', hasta: '' });
  const visibles = useMemo(() => filtrarResueltas(lista, filtros), [lista, filtros]);
  const metricas = useMemo(() => calcularMetricas(visibles), [visibles]);
  const fecha = (v) => { const ms = fechaIncidencia(v); return ms == null ? '—' : new Date(ms).toLocaleString(t('modelos.locale')); };
  const campo = (key) => ({ value: filtros[key], onChange: (e) => setFiltros((prev) => ({ ...prev, [key]: e.target.value })) });
  return <div className="incidencias-resueltas">
    <div className="incidencias-filtros">
      <label>{t('admin.buscarIncidencia')}<input type="search" {...campo('texto')} /></label>
      <label>{t('admin.desdeResolucion')}<input type="date" {...campo('desde')} /></label>
      <label>{t('admin.hastaResolucion')}<input type="date" {...campo('hasta')} /></label>
    </div>
    {!visibles.length ? <p>{t('admin.sinResueltas')}</p> : <>
      <p>{t('admin.metricasNota')}</p>
      <div className="incidencias-graficos">
        <figure><figcaption>{t('admin.resueltasPorPersona')}</figcaption>
          <ResponsiveContainer width="100%" height={260}><BarChart data={metricas.personas} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="persona" /><YAxis allowDecimals={false} /><Tooltip />
            <Bar dataKey="resueltas" name={t('admin.incidenciasResueltas')} fill="#b98b48" />
          </BarChart></ResponsiveContainer>
        </figure>
        <figure><figcaption>{t('admin.tiempoPorPersona')}</figcaption>
          <ResponsiveContainer width="100%" height={260}><BarChart data={metricas.personas} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="persona" /><YAxis /><Tooltip />
            <Bar dataKey="horasMedias" name={t('admin.horasMedias')} fill="#527b69" />
          </BarChart></ResponsiveContainer>
        </figure>
        <figure><figcaption>{t('admin.evolucionTiempo')}</figcaption>
          <ResponsiveContainer width="100%" height={260}><LineChart data={metricas.evolucion} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="dia" /><YAxis /><Tooltip />
            <Line dataKey="horasMedias" name={t('admin.horasMedias')} stroke="#527b69" />
          </LineChart></ResponsiveContainer>
        </figure>
      </div>
      <ul className="lista-registros">{visibles.map((r) => <li key={r.id} className="registro">
        <div>
          <strong>{r.motivo}</strong> · {r.nombre} ({r.email})
          <p className="registro-detalle">{r.mensaje}</p>
          <p>{t('admin.creadaFecha')}: {fecha(r.creado)}</p>
          <p>{t('admin.resolucionAutor')}: {r.resueltoPorNombre || r.resueltoPor || t('admin.sinRegistrar')} · {fecha(r.resueltaEn)}</p>
          <p>{t('admin.propuestaResolucion')}: {r.propuestaResolucion || '—'}</p>
          <p>{t('admin.solucion')}: {r.solucion || '—'}</p>
          <p>{t('admin.encargado')}: {r.encargado || '—'}</p>
        </div>
      </li>)}</ul>
    </>}
  </div>;
}
