/**
 * DemoPaneles (#/demo-paneles) — vista de demostración de los paneles admin y
 * restaurante con datos simulados. No requiere sesión ni lee de Firestore.
 */
import { useState } from 'react';
import OpsDashboard from './OpsDashboard.jsx';
import OpsFinanzas from './OpsFinanzas.jsx';
import { RevenueLineChart, ReservationsPieChart, RevenueBarChart } from '../dashboard/Charts.jsx';
import DocumentoFiscal from '../fiscal/DocumentoFiscal.jsx';
import OpsInformeUsuarios from './OpsInformeUsuarios.jsx';
import OpsUsuarios from './OpsUsuarios.jsx';
import { crearOverviewSimulado } from './opsDemo.js';
import '../../styles/ops.css';
import { useT } from '../../i18n/index.jsx';
import es from '../../i18n/es.js';
import ca from '../../i18n/ca.js';
import en from '../../i18n/en.js';

const TRADS = { es, ca, en };

const DEMO = crearOverviewSimulado();
const ING_MES = {
  '2026-05': { facturacion: 6120, comisiones: 489.6, tickets: 64 },
  '2026-06': { facturacion: 7480, comisiones: 598.4, tickets: 78 },
  '2026-07': { facturacion: 9310, comisiones: 744.8, tickets: 96 },
  '2026-08': { facturacion: 8640, comisiones: 691.2, tickets: 88 },
  '2026-09': { facturacion: 10220, comisiones: 817.6, tickets: 104 },
  '2026-10': { facturacion: 4150, comisiones: 332.0, tickets: 41 },
};

export default function DemoPaneles() {
  const t = useT(TRADS);
  const [vista, setVista] = useState('admin');
  const [documento, setDocumento] = useState(null);
  const tabs = [['admin', t('tx.demoTabAdmin')], ['finanzas', t('tx.demoTabFinanzas')], ['restaurante', t('tx.demoTabRest')], ['clientes', t('tx.demoTabClientes')], ['usuarios', t('tx.demoTabUsuarios')]];

  return (
    <div className="ops-shell">
      <main className="ops-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="ops-pill warn">{t('tx.demoModo')}</span>
          <div className="ops-seg" role="tablist" aria-label={t('tx.demoVista')}>
            {tabs.map(([id, nombre]) => (
              <button key={id} type="button" role="tab" aria-selected={vista === id} className={vista === id ? 'active' : ''} onClick={() => setVista(id)}>{nombre}</button>
            ))}
          </div>
        </div>

        {vista === 'admin' && <OpsDashboard demo={DEMO} />}
        {vista === 'finanzas' && <OpsFinanzas demo={DEMO} />}
        {vista === 'clientes' && <OpsInformeUsuarios soloSimulado />}
        {vista === 'usuarios' && <OpsUsuarios />}
        {vista === 'restaurante' && (
          <>
            <div className="ops-hero">
              <div>
                <h1>{t('tx.demoPanelRest')}</h1>
                <p>{t('tx.demoGraficos')}</p>
              </div>
              <div className="ops-actions">
                <button type="button" className="ops-btn soft" onClick={() => setDocumento('factura')}><span className="material-symbols-outlined">receipt_long</span>{t('tx.demoFactura')}</button>
                <button type="button" className="ops-btn primary" onClick={() => setDocumento('fiscal')}><span className="material-symbols-outlined">file_present</span>{t('tx.demoReporteFiscal')}</button>
              </div>
            </div>
            <div className="ops-grid-8-4">
              <div className="ops-card"><RevenueLineChart data={ING_MES} title={t('tx.demoEvolucion')} /></div>
              <div className="ops-card"><ReservationsPieChart completadas={96} canceladas={23} noShow={9} pendientes={41} title={t('tx.demoDistribucion')} /></div>
            </div>
            <div className="ops-card"><RevenueBarChart data={ING_MES} title={t('tx.demoTicketsMes')} /></div>
          </>
        )}
      </main>
      {documento && (
        <DocumentoFiscal tipo={documento} comisionPct={8} restaurante={documento === 'factura' ? { nombre: 'Can Solé', ciudad: 'Barcelona', direccion: 'Carrer Sant Carles 4' } : { nombre: 'Can Solé' }} onClose={() => setDocumento(null)} />
      )}
    </div>
  );
}
