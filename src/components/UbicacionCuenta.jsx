/**
 * Sección de «Mi cuenta»: estado de la ubicación para ofertas cercanas (G03).
 * «Activar» lanza directamente el permiso del navegador (C02): la explicación
 * RGPD ya se dio en el primer arranque y está en el texto de la sección.
 */
import useUbicacion from '../hooks/useUbicacion.js';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';

const TRADS = { es, ca, en };

export default function UbicacionCuenta() {
  const t = useT(TRADS);
  const { consentimiento, activa, posicion, error, aceptar, rechazar } = useUbicacion();

  return (
    <>
      <h2 className="cuenta-sub">{t('ubicacion.titulo')}</h2>
      <div className="prefs-form prefs-card" data-test="ubicacion-cuenta">
        <p className="vacio-texto">{t('ubicacion.descripcion')}</p>
        <p className="vacio-texto"><small>{t('ubicacion.puntoRecorrido')} {t('ubicacion.puntoAbierta')}</small></p>
        <p role="status" data-test="ubicacion-estado">
          <strong>{t(activa ? 'ubicacion.estadoActiva' : 'ubicacion.estadoInactiva')}</strong>
        </p>
        {activa && !error && !posicion && <p className="vacio-texto">{t('ubicacion.buscando')}</p>}
        {activa && error && <p className="auth-error" role="alert">{t(`ubicacion.${error}`)}</p>}
        {activa && posicion && (
          <p className="vacio-texto" data-test="ubicacion-posicion">
            {t('ubicacion.posicionActual', { lat: posicion.lat, lng: posicion.lng })}
            {posicion.precisionM != null && ` · ${t('ubicacion.precision', { m: posicion.precisionM })}`}
            <br />
            <small>{t('ubicacion.noSeEnvia')}</small>
          </p>
        )}
        {activa ? (
          <button type="button" className="btn-secundario btn-peq" onClick={rechazar} data-test="ubicacion-desactivar">{t('ubicacion.desactivar')}</button>
        ) : (
          <button type="button" className="btn-cta btn-peq" onClick={aceptar} data-test="ubicacion-activar">{t('ubicacion.activar')}</button>
        )}
        {consentimiento.estado === 'rechazado' && <p className="vacio-texto">{t('ubicacion.rechazadaNota')}</p>}
      </div>
    </>
  );
}
