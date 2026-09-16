/** View pura: pie con columnas de navegación y barra legal. */
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';

const TRADS = { es, ca, en };

export default function Footer() {
  const t = useT(TRADS);
  return (
    <footer id="contacto" className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <p className="logo">MIRA</p>
          <p>Guía de restaurantes reales, notas reales.</p>
        </div>
        <nav className="footer-col" aria-label={t('nav.descubrir')}>
          <h2>{t('nav.descubrir')}</h2>
          <ul>
            <li>
              <a href="#buscar">{t('hero.buscar')}</a>
            </li>
            <li>
              <a href="#/reservas">{t('nav.reservas')}</a>
            </li>
            <li>
              <a href="#/contacto">{t('nav.contacto')}</a>
            </li>
          </ul>
        </nav>
        <nav className="footer-col" aria-label={t('nav.miCuenta')}>
          <h2>{t('nav.miCuenta')}</h2>
          <ul>
            <li>
              <a href="#/login">{t('nav.iniciarSesion')}</a>
            </li>
            <li>
              <a href="#/registro">{t('nav.crearCuenta')}</a>
            </li>
            <li>
              <a href="#/cuenta">{t('nav.miCuenta')}</a>
            </li>
          </ul>
        </nav>
        <div className="footer-col">
          <h2>{t('nav.contacto')}</h2>
          <address>
            Calle del Mercado 12, Madrid
            <br />
            hola@mira.ejemplo — 910 123 456
          </address>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 MIRA · Hecho con datos de Yelp y reseñas de la comunidad</p>
        <p>
          <a href="#/privacidad">Política de privacidad</a>
        </p>
      </div>
    </footer>
  );
}
