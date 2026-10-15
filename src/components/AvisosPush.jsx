/**
 * Sección "Notificaciones" de Mi cuenta (T07 + interruptores de T10).
 * El permiso se pide SOLO al pulsar el botón (requisito de iOS).
 * Si la API aún no tiene /v1/push/preferencias, los interruptores no se muestran.
 */
import { useEffect, useState } from 'react';
import { estadoPush, activarPush, desactivarPush, leerPreferenciasPush, guardarPreferenciaPush } from '../services/pushWeb.js';

const CATEGORIAS = ['reservas', 'mensajes', 'promociones'];

export default function AvisosPush({ t, lang }) {
  const [estado, setEstado] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    let vivo = true;
    estadoPush().then((e) => vivo && setEstado(e));
    leerPreferenciasPush().then((p) => vivo && setPrefs(p)).catch(() => {});
    return () => { vivo = false; };
  }, []);

  async function activar() {
    setOcupado(true); setError('');
    try {
      const r = await activarPush(lang);
      if (!r.ok && r.motivo === 'bloqueado') setEstado('bloqueado');
      else if (!r.ok) setError(t('avisos.error'));
      else setEstado('activo');
    } catch (e) {
      console.warn('[MIRA push]', e);
      setError(t('avisos.error'));
    } finally {
      setOcupado(false);
    }
  }

  async function desactivar() {
    setOcupado(true);
    await desactivarPush();
    setEstado('inactivo');
    setOcupado(false);
  }

  async function cambiar(cat) {
    const antes = prefs;
    setPrefs({ ...prefs, [cat]: !prefs[cat] });
    try {
      setPrefs(await guardarPreferenciaPush({ [cat]: !antes[cat] }));
    } catch {
      setPrefs(antes);
      setError(t('avisos.error'));
    }
  }

  if (!estado) return null;

  return (
    <>
      <h2 className="cuenta-sub">{t('avisos.titulo')}</h2>
      <div className="prefs-form prefs-card">
        <p className="vacio-texto">{t(`avisos.estado.${estado}`)}</p>
        {estado === 'instalar-ios' && <a className="btn-secundario btn-peq" href="#/app">{t('avisos.comoInstalar')}</a>}
        {estado === 'inactivo' && (
          <button type="button" className="btn-secundario btn-peq" onClick={activar} disabled={ocupado}>
            {ocupado ? t('avisos.activando') : t('avisos.activar')}
          </button>
        )}
        {estado === 'activo' && (
          <button type="button" className="btn-texto" onClick={desactivar} disabled={ocupado}>
            {t('avisos.desactivar')}
          </button>
        )}
        {error && <p className="reserva-error" role="alert">{error}</p>}

        {prefs && (
          <fieldset className="prefs-alergias chip-grid">
            <legend>{t('avisos.queRecibir')}</legend>
            {CATEGORIAS.map((cat) => (
              <label key={cat} className="campo-check" htmlFor={`aviso-${cat}`}>
                <input id={`aviso-${cat}`} type="checkbox" checked={prefs[cat] !== false} onChange={() => cambiar(cat)} />
                {t(`avisos.categoria.${cat}`)}
              </label>
            ))}
          </fieldset>
        )}
      </div>
    </>
  );
}
