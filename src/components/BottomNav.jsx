/**
 * Bottom navigation bar for mobile — glassmorphic dock style.
 */
export default function BottomNav({ ruta, numFavoritos, numReservas }) {
  const tabs = [
    { id: 'home', label: 'Explorar', href: '#/', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
    )},
    { id: 'reservas', label: 'Reservas', href: '#/reservas', badge: numReservas, icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    )},
    { id: 'mapa', label: 'Mapa', href: '#/mapa', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" /><circle cx="12" cy="10" r="3" />
      </svg>
    )},
    { id: 'favoritos', label: 'Favoritos', href: '#/favoritos', badge: numFavoritos, icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    )},
    { id: 'cuenta', label: 'Perfil', href: '#/cuenta', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    )},
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegación móvil">
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
