/**
 * View: descarga de la app (#/app).
 * - Android: APK de EAS (VITE_APK_URL). Sin URL, el botón sale desactivado.
 * - iPhone: instrucciones para añadir la PWA a la pantalla de inicio (iOS 16.4+).
 * Detecta el dispositivo para poner primero su tarjeta y avisa si ya se está
 * usando la app instalada. Textos en el bloque `app` de i18n.
 */
import { useEffect, useState } from 'react';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import '../styles/descargar.css';

const APK_URL = import.meta.env.VITE_APK_URL || '';

const TRADS = { es, ca, en };

function detectar() {
  const ua = navigator.userAgent || '';
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return {
    so: ios ? 'ios' : /Android/i.test(ua) ? 'android' : 'otro',
    safari: ios && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua),
    instalada: window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true,
  };
}

function IconoCompartir() {
  return (
    <svg className="app-icono-compartir" viewBox="0 0 24 24" width="18" height="18" aria-label="Compartir" role="img">
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconoAndroid() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path fill="currentColor" d="M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.86 3.22a11.4 11.4 0 0 0-9.84 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
    </svg>
  );
}

function IconoApple() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path fill="currentColor" d="M16.37 12.62c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.65zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.58.67-1.09 1.75-.96 2.79 1.02.08 2.05-.52 2.68-1.27z" />
    </svg>
  );
}

function Pasos({ lista, icono }) {
  return (
    <ol className="app-pasos">
      {lista.map((p, i) => {
        const [antes, despues] = p.split('{{icono}}');
        return (
          <li key={i}>
            <span className="app-paso-num" aria-hidden="true">{i + 1}</span>
            <span>{antes}{despues !== undefined && <>{icono}{despues}</>}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function DescargarApp() {
  const t = useT(TRADS);
  const [disp] = useState(detectar);
  const [aviso, setAviso] = useState(null); // beforeinstallprompt (Chrome Android)

  useEffect(() => {
    const guardar = (e) => { e.preventDefault(); setAviso(e); };
    window.addEventListener('beforeinstallprompt', guardar);
    return () => window.removeEventListener('beforeinstallprompt', guardar);
  }, []);

  const instalarWeb = async () => {
    if (!aviso) return;
    aviso.prompt();
    await aviso.userChoice.catch(() => {});
    setAviso(null);
  };

  const tarjetaAndroid = (
    <article key="android" className={`app-tarjeta${disp.so === 'android' ? ' es-tuya' : ''}`} aria-labelledby="app-android">
      {disp.so === 'android' && <span className="app-tuya">{t('app.tuMovil')}</span>}
      <header className="app-tarjeta-cab">
        <span className="app-tarjeta-icono"><IconoAndroid /></span>
        <h2 id="app-android">{t('app.android.titulo')}</h2>
      </header>
      <p className="app-texto">{t('app.android.texto')}</p>
      {APK_URL ? (
        <a className="app-boton" href={APK_URL} download="mira.apk" rel="noopener">{t('app.android.boton')}</a>
      ) : (
        <button type="button" className="app-boton" disabled>{t('app.android.pronto')}</button>
      )}
      <Pasos lista={t('app.android.pasos')} />
      {aviso && (
        <button type="button" className="btn-secundario app-boton-web" onClick={instalarWeb}>{t('app.android.web')}</button>
      )}
    </article>
  );

  const tarjetaIos = (
    <article key="ios" className={`app-tarjeta${disp.so === 'ios' ? ' es-tuya' : ''}`} aria-labelledby="app-ios">
      {disp.so === 'ios' && <span className="app-tuya">{t('app.tuMovil')}</span>}
      <header className="app-tarjeta-cab">
        <span className="app-tarjeta-icono"><IconoApple /></span>
        <h2 id="app-ios">{t('app.ios.titulo')}</h2>
      </header>
      <p className="app-texto">{t('app.ios.texto')}</p>
      {disp.so === 'ios' && !disp.safari && <p className="app-aviso">{t('app.ios.noSafari')}</p>}
      <Pasos lista={t('app.ios.pasos')} icono={<IconoCompartir />} />
      <p className="app-nota">{t('app.ios.nota')}</p>
    </article>
  );

  return (
    <section className="app-pagina">
      <div className="app-hero">
        <p className="app-ojo">{t('app.ojo')}</p>
        <h1>{t('app.titulo')}</h1>
        <p className="app-sub">{t('app.sub')}</p>
        <ul className="app-ventajas">
          {t('app.ventajas').map((v) => <li key={v}>{v}</li>)}
        </ul>
      </div>

      {disp.instalada && <p className="app-instalada" role="status">{t('app.instalada')}</p>}

      <div className="app-rejilla">
        {disp.so === 'ios' ? [tarjetaIos, tarjetaAndroid] : [tarjetaAndroid, tarjetaIos]}
      </div>

      {disp.so === 'otro' && (
        <p className="app-escritorio">
          {t('app.escritorio')} <strong>{window.location.origin}/#/app</strong>
        </p>
      )}
    </section>
  );
}
