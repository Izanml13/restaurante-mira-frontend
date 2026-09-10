/** View pura: cabecera con sesión (todo por props, sin lógica). Respeta identidad TheFork, añade iconos SVG lucide. */
export default function Header({ usuario, esAdmin, perfil, numFavoritos, onSalir }) {
  return (
    <header className="site-header">
      <a href="#/" className="logo">MIRA</a>
      <nav aria-label="Navegación principal">
        <ul className="nav-list">
          <li><a href="#inicio">Descubrir</a></li>
          <li><a href="#buscar">Buscar</a></li>
          <li><a href="#/contacto">Contacto</a></li>
        </ul>
      </nav>
      <div className="header-cuentas">
        {usuario ? (
          <>
            <a href="#/reservas" className="btn-texto">
              Mis reservas
            </a>
            <a href="#/favoritos" className="btn-texto" aria-label={`Favoritos (${numFavoritos})`}>
              ♥{numFavoritos > 0 ? ` ${numFavoritos}` : ''}
            </a>
            {esAdmin && (
              <a href="#/admin" className="btn-texto">
                Admin
              </a>
            )}
            {perfil?.tipo === 'empresa' && (
              <a href="#/negocio" className="btn-texto">
                Mi restaurante
              </a>
            )}
            <a href="#/cuenta" className="header-cuenta-link" title={usuario.email}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Mi cuenta</span>
              <span className="header-cuenta-nombre">{usuario.nombre || usuario.email}</span>
            </a>
            <button type="button" className="btn-texto header-logout" onClick={onSalir} aria-label="Cerrar sesión">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Cerrar sesión</span>
            </button>
          </>
        ) : (
          <>
            <a href="#/favoritos" className="btn-texto" aria-label={`Favoritos (${numFavoritos})`}>
              ♥{numFavoritos > 0 ? ` ${numFavoritos}` : ''}
            </a>
            <a href="#/login" className="header-login">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Iniciar sesión
            </a>
            <a href="#/registro" className="btn-cta btn-peq header-registro">
              Crear cuenta
            </a>
          </>
        )}
      </div>
    </header>
  );
}
