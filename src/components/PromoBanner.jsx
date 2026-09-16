/** View pura: franja de ventajas con diseño editorial. */
const VENTAJAS = [
  { titulo: 'Notas reales', texto: 'Medias de Yelp y de nuestra comunidad.' },
  { titulo: 'Cerca de ti', texto: 'Distancia real desde tu ubicación.' },
  { titulo: 'Sin coste', texto: 'Buscar y reservar es siempre gratis.' },
];

export default function PromoBanner() {
  return (
    <section className="promo" aria-label="Ventajas de MIRA">
      <ul className="promo-lista">
        {VENTAJAS.map((v) => (
          <li key={v.titulo} className="promo-item">
            <span className="promo-check" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
            </span>
            <div>
              <strong>{v.titulo}.</strong> {v.texto}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
