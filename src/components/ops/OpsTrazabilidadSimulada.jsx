/**
 * OpsTrazabilidadSimulada — trazabilidad en el formato de la colección `logs`
 * del backend (middleware accessLog, bloques de 200), con dos orígenes:
 *  - simulado: peticiones que habrían hecho los usuarios simulados.
 *  - real: llamadas que esta web ha hecho de verdad a la API en la sesión.
 * Todo en memoria: no lee ni escribe en la base de datos.
 */
import { useEffect, useMemo, useState } from 'react';
import { obtenerTrazaReal, suscribirTrazaReal, limpiarTrazaReal } from '../../services/trazaReal.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { generarLogsSimulados, agruparEnBloques, filtrarLogs, resumenLogs } from './informeUsuarios.js';
import { descargarCSV } from './opsData.js';
import { useT } from '../../i18n/index.jsx';
import es from '../../i18n/es.js';
import ca from '../../i18n/ca.js';
import en from '../../i18n/en.js';

const TRADS = { es, ca, en };

const POR_DOC = 200;

export default function OpsTrazabilidadSimulada({ usuarios }) {
  const t = useT(TRADS);
  const [uid, setUid] = useState('');
  const [modulo, setModulo] = useState('');
  const [soloErrores, setSoloErrores] = useState(false);
  const [bloqueVisto, setBloqueVisto] = useState(null);
  const [origen, setOrigen] = useState('');
  const [reales, setReales] = useState(obtenerTrazaReal);
  useEffect(() => suscribirTrazaReal((r) => setReales([...r])), []);

  const simulados = useMemo(
    () => generarLogsSimulados(usuarios).map((x) => ({ ...x, origen: 'simulado' })),
    [usuarios],
  );
  const registros = useMemo(
    () => [...simulados, ...reales]
      .filter((x) => !origen || x.origen === origen)
      .sort((a, b) => a.ts.localeCompare(b.ts)),
    [simulados, reales, origen],
  );
  const bloques = useMemo(() => agruparEnBloques(registros, POR_DOC), [registros]);
  const filtrados = useMemo(() => filtrarLogs(registros, { uid, modulo, soloErrores }), [registros, uid, modulo, soloErrores]);
  const res = useMemo(() => resumenLogs(filtrados), [filtrados]);
  const modulos = useMemo(() => [...new Set(registros.map((x) => x.modulo))].sort(), [registros]);

  function exportarCSV() {
    descargarCSV(`logs_simulados_${new Date().toISOString().slice(0, 10)}.csv`,
      ['ts', 'origen', 'metodo', 'ruta', 'path', 'modulo', 'status', 'ms', 'uid', 'rol', 'anonimo', 'requestId'],
      filtrados.map((x) => [x.ts, x.origen, x.metodo, x.ruta, x.path, x.modulo, x.status, x.ms, x.uid || '', x.rol || '', x.anonimo ? 'sí' : 'no', x.requestId]));
  }

  return (
    <section className="informe-seccion" aria-label={t('tx.trzSimulada')}>
      <div className="ops-card-head">
        <div>
          <h2>{t('tx.trzTitulo')}</h2>
          <p className="ops-card-sub">
            <strong>{reales.length}</strong> {t('tx.trzRealesSesion')} <strong>{simulados.length}</strong> simuladas
            → {bloques.length} documentos en formato <code>logs</code> (bloques de {POR_DOC}). Sin consultas a la BD.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="ops-btn soft sm" onClick={limpiarTrazaReal} disabled={!reales.length}>{t('tx.trzVaciar')}</button>
          <button type="button" className="ops-btn soft sm" onClick={exportarCSV} disabled={!filtrados.length}>CSV</button>
        </div>
      </div>

      <div className="informe-kpis">
        <div><strong>{res.total}</strong><span>peticiones</span></div>
        <div><strong>{res.usuarios}</strong><span>{t('tx.trzConSesion')}</span></div>
        <div><strong>{res.anonimas}</strong><span>{t('tx.trzAnonimas')}</span></div>
        <div><strong>{res.errores}</strong><span>errores (4xx/5xx)</span></div>
      </div>

      <div className="ops-toolbar informe-filtros" role="search">
        <input className="ops-input" type="search" placeholder={t('tx.trzPhUid')} value={uid}
          onChange={(e) => setUid(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
        <select className="ops-input" value={origen} onChange={(e) => setOrigen(e.target.value)} aria-label={t('tx.opsOrigen')}>
          <option value="">{t('tx.trzRealSim')}</option>
          <option value="real">{t('tx.trzSoloReal')}</option>
          <option value="simulado">{t('tx.trzSoloSim')}</option>
        </select>
        <select className="ops-input" value={modulo} onChange={(e) => setModulo(e.target.value)} aria-label={t('tx.trzModulo')}>
          <option value="">{t('tx.trzTodosModulos')}</option>
          {modulos.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <label><input type="checkbox" checked={soloErrores} onChange={(e) => setSoloErrores(e.target.checked)} /> {t('tx.trzSoloErrores')}</label>
      </div>

      <div className="informe-graficos">
        <figure>
          <figcaption>{t('tx.trzPorModulo')}</figcaption>
          <BarChart width={340} height={220} data={res.porModulo}>
            <XAxis dataKey="nombre" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip />
            <Bar dataKey="valor" name="Peticiones" fill="#004393" isAnimationActive={false} />
          </BarChart>
        </figure>
        <figure>
          <figcaption>{t('tx.trzDocumentosEn')} <code>logs</code></figcaption>
          <ul className="informe-bloques">
            {bloques.map((b, i) => (
              <li key={b.desde}>
                <button type="button" className="ops-btn soft sm" onClick={() => setBloqueVisto(i)}>
                  Doc {i + 1}
                </button>
                {' '}{b.n} peticiones · {b.uids.length} usuarios · {b.errores} errores · {b.dia}
              </li>
            ))}
          </ul>
        </figure>
      </div>

      <div className="informe-tabla-wrap">
        <table className="informe-tabla">
          <thead>
            <tr><th>{t('tx.trzFecha')}</th><th>{t('tx.trzOrigen')}</th><th>{t('tx.trzMetodo')}</th><th>{t('tx.cargaRuta')}</th><th>{t('tx.trzEstado')}</th><th>ms</th><th>{t('tx.trzUsuario')}</th></tr>
          </thead>
          <tbody>
            {filtrados.slice(-200).reverse().map((x) => (
              <tr key={x.requestId}>
                <td>{new Date(x.ts).toLocaleString('es-ES')}</td>
                <td><span className={`ops-pill ${x.origen === 'real' ? '' : 'warn'}`}>{x.origen === 'real' ? 'Real' : 'Simulado'}</span></td>
                <td>{x.metodo}</td>
                <td><code>{x.ruta}</code></td>
                <td className={x.status >= 400 ? 'informe-error' : ''}>{x.status}</td>
                <td>{x.ms}</td>
                <td>{x.uid || 'anónimo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length > 200 && <p className="ops-muted">Mostrando las 200 más recientes de {filtrados.length}. El CSV las incluye todas.</p>}
      </div>

      {bloqueVisto != null && (
        <div className="ops-modal-overlay" onClick={() => setBloqueVisto(null)}>
          <div className="ops-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="bloque-t">
            <h3 id="bloque-t">logs / documento {bloqueVisto + 1}</h3>
            <pre className="informe-json">{JSON.stringify({ ...bloques[bloqueVisto], registros: [...bloques[bloqueVisto].registros.slice(0, 3), `… ${Math.max(0, bloques[bloqueVisto].n - 3)} más`] }, null, 2)}</pre>
            <div className="ops-modal-actions"><button type="button" className="ops-btn soft sm" onClick={() => setBloqueVisto(null)}>{t('tx.infCerrar')}</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
