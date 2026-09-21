/**
 * Bottom navigation bar for mobile — glassmorphic dock style.
 */
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';

const TRADS = { es, ca, en };

export default function BottomNav({ ruta, numFavoritos, numReservas, puntosSaldo, esAdmin, perfil }) {
  const t = useT(TRADS);

  const tabs = [
    { id: 'home', label: t('bottomNav.explorar'), href: '#/', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
    )},
    { id: 'puntos', label: t('bottomNav.puntos') || 'Puntos', href: '#/puntos', badge: puntosSaldo > 0 ? puntosSaldo : null, icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v12M6 12h12" />
      </svg>
    )},
    { id: 'reservas', label: t('bottomNav.reservas'), href: '#/reservas', badge: numReservas, icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    )},
    { id: 'favoritos', label: t('bottomNav.favoritos'), href: '#/favoritos', badge: numFavoritos, icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    )},
    ...(esAdmin ? [{ id: 'admin', label: 'Admin', href: '#/admin', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    )}] : []),
    ...(perfil?.tipo === 'empresa' ? [{ id: 'dashboard', label: 'Panel', href: '#/dashboard', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    )}] : []),
    { id: 'cuenta', label: t('bottomNav.perfil'), href: '#/cuenta', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    )},
  ];

  return (
    <nav className="bottom-nav" aria-label={t('bottomNav.navMovil')}>
      <div className="bottom-nav-inner">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={tab.href}
            className={`bottom-nav-item${ruta === tab.id ? ' active' : ''}`}
            aria-current={ruta === tab.id ? 'page' : undefined}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge > 0 && <span className="badge" aria-label={`${tab.badge}`}>{tab.badge}</span>}
          </a>
        ))}
      </div>
    </nav>
  );
}
