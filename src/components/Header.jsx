/**
 * View pura: cabecera con sesión (todo por props, sin lógica de negocio).
 * En móvil el menú colapsa tras el botón hamburguesa (estado solo visual).
 */
import { useEffect, useState } from 'react';

export default function Header({ usuario, esAdmin, perfil, numFavoritos, noLeidos, tema, onCambiarTema, onSalir }) {
  const [abierto, setAbierto] = useState(false);
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    if (!abierto) return undefined;
    function alTeclar(e) {
      if (e.key === 'Escape') setAbierto(false);
    }
    window.addEventListener('keydown', alTeclar);
    return () => window.removeEventListener('keydown', alTeclar);
  }, [abierto]);

  // En móvil el header se esconde al bajar y vuelve al subir.
  useEffect(() => {
    let ultimo = window.scrollY;
    let turno = false;
    function alDesplazar() {
      if (turno) return;
      turno = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setOculto(y > 160 && y > ultimo);
        ultimo = y;
        turno = false;
      });
    }
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, []);

  function cerrar() {
    setAbierto(false);
  }

  // El icono del mail conmuta: si ya estás en el buzón, lo cierra (vuelve al inicio).
  function conmutarMensajes(e) {
    if (window.location.hash === '#/mensajes') {
      e.preventDefault();
      cerrar();
      window.location.hash = '#/';
    }
  }

  return (
    <header className={`site-header${oculto ? ' oculto' : ''}`}>
      <a href="#/" className="logo logo-imagen" aria-label="MIRA - inicio" onClick={cerrar}>
        <img src="/logo.png" alt="MIRA" />
      </a>
      <button
        type="button"
        className="tema-boton"
        onClick={onCambiarTema}
        aria-label={tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-pressed={tema === 'oscuro'}
        title={tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}
      >
        ◐
      </button>
      <button
        type="button"
        className="menu-boton"
        aria-expanded={abierto}
        aria-controls="menu-movil"
        aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setAbierto((v) => !v)}
      >
        {abierto ? '✕' : '☰'}
      </button>
      <div id="menu-movil" className={`header-menu${abierto ? ' abierto' : ''}`}>
        <nav aria-label="Navegación principal" onClick={cerrar}>
          <ul className="nav-list">
            <li><a href="#inicio">Descubrir</a></li>
            <li><a href="#/mapa">Mapa</a></li>
            <li><a href="#/contacto">Contacto</a></li>
          </ul>
        </nav>
        <div className="header-cuentas" onClick={cerrar}>
          {usuario ? (
            <>
              <a href="#/reservas" className="btn-texto">
                Mis reservas
              </a>
              <a href="#/favoritos" className="btn-texto btn-fav" aria-label={`Favoritos (${numFavoritos})`}>
                ♥{numFavoritos > 0 ? ` ${numFavoritos}` : ''}
              </a>
              <a href="#/mensajes" className="btn-texto btn-fav" onClick={conmutarMensajes} aria-label={`Mensajes${noLeidos > 0 ? `, ${noLeidos} sin leer` : ''}`}>
                ✉{noLeidos > 0 ? ` ${noLeidos}` : ''}
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
              <a href="#/favoritos" className="btn-texto btn-fav" aria-label={`Favoritos (${numFavoritos})`}>
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
      </div>
    </header>
  );
}
