/** View pura: cabecera con sesión (todo por props, sin lógica). */
export default function Header({ usuario, onSalir }) {
  return (
    <header className="site-header">
      <a href="#/" className="logo">
        MIRA
      </a>
      <nav aria-label="Navegación principal">
        <ul className="nav-list">
          <li>
            <a href="#inicio">Descubrir</a>
          </li>
          <li>
            <a href="#buscar">Buscar</a>
          </li>
          <li>
            <a href="#/contacto">Contacto</a>
          </li>
        </ul>
      </nav>
      <div className="header-cuentas">
        {usuario ? (
          <>
            <a href="#/cuenta" className="header-usuario" title={usuario.email}>
              Hola, {usuario.nombre || usuario.email}
            </a>
            <button type="button" className="btn-texto" onClick={onSalir}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <a href="#/login" className="btn-texto">
              Iniciar sesión
            </a>
            <a href="#/registro" className="btn-cta btn-peq">
              Crear cuenta
            </a>
          </>
        )}
      </div>
    </header>
  );
}
