/** View pura: pie de la landing. */
export default function Footer() {
  return (
    <footer id="contacto" className="site-footer">
      <div className="footer-col">
        <p className="logo">MIRA</p>
        <p>La guía de barrio para decidir dónde comer sin dar vueltas.</p>
      </div>
      <div className="footer-col">
        <h2>Visítanos</h2>
        <address>
          Calle del Mercado 12, Madrid
          <br />
          hola@mira.ejemplo — 910 123 456
        </address>
      </div>
      <div className="footer-col">
        <h2>Horario</h2>
        <p>
          Lunes a domingo
          <br />
          12:00 – 23:30
        </p>
      </div>
    </footer>
  );
}
