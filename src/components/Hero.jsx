/** View pura: hero fotográfico con cifras (sin atajos). */
export default function Hero({ total, numZonas }) {
  return (
    <section id="inicio" className="hero" aria-labelledby="hero-titulo">
      <div className="hero-contenido">
        <h1 id="hero-titulo">Reserva tu mesa perfecta</h1>
        <p className="hero-sub">
          Descubre los mejores restaurantes de Cataluña, compara notas reales y
          encuentra sitio cerca de ti en menos de un minuto.
        </p>
        <a href="#buscar" className="btn-cta btn-grande">
          Buscar restaurantes
        </a>
        {(total > 0 || numZonas > 0) && (
          <ul className="hero-stats" aria-label="La guía en cifras">
            {total > 0 && (
              <li>
                <strong>{total.toLocaleString('es-ES')}</strong> restaurantes
              </li>
            )}
            {numZonas > 0 && (
              <li>
                <strong>{numZonas}</strong> zonas
              </li>
            )}
            <li>
              <strong>50</strong> reseñas por local
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}
