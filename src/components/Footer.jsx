/** View pura: pie con columnas de navegación y barra legal. */
export default function Footer() {
  return (
    <footer id="contacto" className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <p className="logo">MIRA</p>
          <p>La guía de barrio para decidir dónde comer sin dar vueltas.</p>
        </div>
        <nav className="footer-col" aria-label="Descubrir">
          <h2>Descubrir</h2>
          <ul>
            <li>
              <a href="#buscar">Buscar restaurantes</a>
            </li>
            <li>
              <a href="#/reservas">Mis reservas</a>
            </li>
            <li>
              <a href="#/contacto">Contacto</a>
            </li>
          </ul>
        </nav>
        <nav className="footer-col" aria-label="Cuenta">
          <h2>Cuenta</h2>
          <ul>
            <li>
              <a href="#/login">Iniciar sesión</a>
            </li>
            <li>
              <a href="#/registro">Crear cuenta</a>
            </li>
            <li>
              <a href="#/cuenta">Mi cuenta</a>
            </li>
          </ul>
        </nav>
        <div className="footer-col">
          <h2>Contacto</h2>
          <address>
            Calle del Mercado 12, Madrid
            <br />
            hola@mira.ejemplo — 910 123 456
          </address>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 MIRA · Hecho con datos de Yelp y reseñas de la comunidad</p>
      </div>
    </footer>
  );
}
