/** View pura: página "Mi cuenta" (protegida, todo por props). */
export default function Cuenta({ usuario, onSalir }) {
  if (!usuario) {
    window.location.hash = '#/login';
    return null;
  }

  const inicial = (usuario.nombre || usuario.email || '?').trim().charAt(0).toUpperCase();
  const miembroDesde = usuario.creado
    ? new Date(usuario.creado).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <section className="auth-pagina" aria-labelledby="cuenta-titulo">
      <div className="auth-tarjeta">
        <p className="cuenta-avatar" aria-hidden="true">
          {inicial}
        </p>
        <h1 id="cuenta-titulo">{usuario.nombre || 'Mi cuenta'}</h1>
        <dl className="cuenta-datos">
          <div>
            <dt>Correo</dt>
            <dd>{usuario.email}</dd>
          </div>
          <div>
            <dt>Miembro desde</dt>
            <dd>{miembroDesde}</dd>
          </div>
        </dl>
        <p className="cuenta-acciones">
          <a href="#buscar" className="btn-cta">
            Buscar restaurantes
          </a>
          <button type="button" className="btn-secundario" onClick={onSalir}>
            Cerrar sesión
          </button>
        </p>
      </div>
    </section>
  );
}
