/**
 * Primer arranque (C02): pasos seguidos cookies → ubicación → notificaciones,
 * también sin sesión. Cada decisión se guarda como consentimiento RGPD
 * (dispositivo y, con sesión, perfil) y no se vuelve a preguntar.
 * Aceptar lanza directamente el permiso del navegador.
 * Al iniciar sesión sincroniza con el perfil y registra el push si ya estaba aceptado.
 */
import { useCallback, useEffect, useState } from 'react';
import CookieBanner from './CookieBanner.jsx';
import useUbicacion from '../hooks/useUbicacion.js';
import { leerCookies, tieneConsentimiento } from '../services/cookieService.js';
import { leerConsentimientos, decidirConsentimiento, sincronizarConsentimientos, EVENTO } from '../services/consentimientosApi.js';
import { estadoPush, pedirPermisoPush, registrarSiAceptado } from '../services/pushWeb.js';
import { pasoPendiente } from '../models/consentimientosModel.js';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';

const TRADS = { es, ca, en };
// Sin Web Push posible (navegador sin soporte o sin clave VAPID) no se pregunta.
const SIN_PUSH = ['no-soportado', 'sin-clave'];

function Paso({ t, numero, titulo, texto, puntos, aceptar, ahoraNo, ocupado, extra }) {
  return (
    <div className="cookie-fondo" role="dialog" aria-modal="false" aria-labelledby="primer-arranque-titulo" data-test={`primer-arranque-${numero}`}>
      <div className="cookie-banner primer-arranque">
        <div className="cookie-texto">
          <p className="primer-arranque-paso">{t('bienvenida.paso', { n: numero, total: 3 })}</p>
          <h2 id="primer-arranque-titulo" className="cookie-titulo">{titulo}</h2>
          <p>{texto}</p>
          {puntos?.length > 0 && <ul className="ubicacion-puntos">{puntos.map((p) => <li key={p}>{p}</li>)}</ul>}
          {extra}
        </div>
        <div className="cookie-acciones">
          <button type="button" className="btn-cta btn-peq" onClick={aceptar} disabled={ocupado} data-test="primer-arranque-aceptar">{t('bienvenida.aceptar')}</button>
          <button type="button" className="btn-secundario btn-peq" onClick={ahoraNo} disabled={ocupado} data-test="primer-arranque-ahora-no">{t('bienvenida.ahoraNo')}</button>
        </div>
      </div>
    </div>
  );
}

export default function PrimerArranque({ usuario, lang }) {
  const t = useT(TRADS);
  const ubicacion = useUbicacion();
  const [cookiesDecididas, setCookiesDecididas] = useState(null); // null = cargando
  const [consentimientos, setConsentimientos] = useState(leerConsentimientos);
  const [push, setPush] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const releer = useCallback(() => setConsentimientos(leerConsentimientos()), []);

  useEffect(() => {
    let vivo = true;
    leerCookies(usuario?.uid).then((c) => vivo && setCookiesDecididas(tieneConsentimiento(c))).catch(() => vivo && setCookiesDecididas(false));
    estadoPush().then((e) => vivo && setPush(e)).catch(() => vivo && setPush('no-soportado'));
    return () => { vivo = false; };
  }, [usuario]);

  useEffect(() => {
    window.addEventListener(EVENTO, releer);
    window.addEventListener('storage', releer);
    return () => { window.removeEventListener(EVENTO, releer); window.removeEventListener('storage', releer); };
  }, [releer]);

  // Al iniciar sesión: decisión más reciente entre dispositivo y perfil, y push si ya se aceptó.
  useEffect(() => {
    if (!usuario?.uid) return;
    sincronizarConsentimientos().finally(() => {
      if (leerConsentimientos().notificaciones?.estado === 'aceptado') registrarSiAceptado(lang);
    });
  }, [usuario?.uid, lang]);

  if (cookiesDecididas === null || push === null) return null;
  const notificaciones = consentimientos.notificaciones || (SIN_PUSH.includes(push) ? { estado: 'sin-push' } : null);
  const paso = pasoPendiente({ cookiesDecididas, ubicacion: consentimientos.ubicacion, notificaciones });

  if (paso === 'cookies') return <CookieBanner usuario={usuario} onDecidido={() => setCookiesDecididas(true)} />;

  if (paso === 'ubicacion') {
    return (
      <Paso
        t={t} numero={2} ocupado={ocupado}
        titulo={t('ubicacion.modalTitulo')} texto={t('ubicacion.modalIntro')}
        puntos={[t('ubicacion.puntoUso'), t('ubicacion.puntoRecorrido'), t('ubicacion.puntoAbierta'), t('ubicacion.puntoDesactivar')]}
        aceptar={() => ubicacion.aceptar()}
        ahoraNo={() => ubicacion.rechazar()}
      />
    );
  }

  if (paso === 'notificaciones') {
    const iosSinInstalar = push === 'instalar-ios';
    return (
      <Paso
        t={t} numero={3} ocupado={ocupado}
        titulo={t('bienvenida.notifTitulo')} texto={t('bienvenida.notifTexto')}
        puntos={[t('bienvenida.notifPunto1'), t('bienvenida.notifPunto2'), t('bienvenida.notifPunto3')]}
        extra={iosSinInstalar && <p className="vacio-texto"><a href="#/app">{t('bienvenida.notifIos')}</a></p>}
        aceptar={async () => {
          setOcupado(true);
          try {
            if (iosSinInstalar) { await decidirConsentimiento('notificaciones', 'aceptado'); return; }
            const permiso = await pedirPermisoPush();
            // Lo que cuenta es lo que el usuario contesta al navegador.
            await decidirConsentimiento('notificaciones', permiso === 'granted' ? 'aceptado' : 'rechazado');
            if (permiso === 'granted' && usuario?.uid) await registrarSiAceptado(lang);
          } finally { setOcupado(false); }
        }}
        ahoraNo={() => decidirConsentimiento('notificaciones', 'rechazado')}
      />
    );
  }
  return null;
}
