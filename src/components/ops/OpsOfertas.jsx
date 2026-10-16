/** OpsOfertas — el admin elige un restaurante y gestiona sus ofertas por distancia (editor de G04 + estadísticas de G07). */
import { useState } from 'react';
import OfertasPanel from '../dashboard/OfertasPanel.jsx';
import OfertasStats from '../dashboard/OfertasStats.jsx';
import '../dashboard/dashboard.css';
import { listarRestaurantesAdmin, mensajeErrorFirestore } from './opsData.js';
import { useT } from '../../i18n/index.jsx';
import es from '../../i18n/es.js';
import ca from '../../i18n/ca.js';
import en from '../../i18n/en.js';

const TRADS = { es, ca, en };

export default function OpsOfertas() {
  const t = useT(TRADS);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [rest, setRest] = useState(null);

  async function buscar() {
    if (!q.trim()) return;
    setBuscando(true);
    setError('');
    try {
      const r = await listarRestaurantesAdmin({ q: q.trim(), limit: 10 });
      setItems(r.items);
    } catch (e) {
      setError(mensajeErrorFirestore(e));
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="ops-card">
      <div className="ops-card-head">
        <div>
          <h2>{t('ops.seccOfertas')}</h2>
          <p className="ops-card-sub">{rest ? rest.nombre : t('ops.ofertasElige')}</p>
        </div>
        {rest && (
          <button type="button" className="ops-btn soft sm" onClick={() => setRest(null)}>{t('ops.ofertasCambiar')}</button>
        )}
      </div>
      {!rest && (
        <>
          <div className="ops-toolbar" role="search">
            <input className="ops-input" type="search" placeholder={t('ops.phBuscarRestaurante')} value={q}
              onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') buscar(); }} />
            <button type="button" className="ops-btn primary sm" disabled={buscando} onClick={buscar}>{t('ops.buscar')}</button>
          </div>
          {error && <p role="alert">{error}</p>}
          <ul className="ops-ofertas-lista">
            {items.map((r) => (
              <li key={r.id}>
                <button type="button" className="ops-btn soft sm" onClick={() => setRest(r)}>
                  {r.nombre}{r.ciudad ? ` · ${r.ciudad}` : ''}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {rest && (
        <>
          <OfertasPanel restauranteId={rest.id} />
          <OfertasStats restauranteId={rest.id} />
        </>
      )}
    </div>
  );
}
