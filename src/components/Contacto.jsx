/** View pura: formulario de contacto (estado local + callback de envío). */
import { useEffect, useState } from 'react';

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOTIVOS = ['Reserva de mesa', 'Sugerir un restaurante', 'Incidencia con una reseña', 'Otro'];

export default function Contacto({ usuario, onEnviar }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Si la sesión llega después, pre-rellena sin pisar lo escrito.
  useEffect(() => {
    if (!usuario) return;
    setNombre((v) => v || usuario.nombre || '');
    setEmail((v) => v || usuario.email || '');
  }, [usuario]);

  async function manejarEnvio(e) {
    e.preventDefault();
    if (nombre.trim().length < 2) return setError('Escribe tu nombre (mínimo 2 letras).');
    if (!EMAIL_OK.test(email.trim())) return setError('Escribe un correo válido.');
    if (mensaje.trim().length < 10) return setError('Cuéntanos un poco más (mínimo 10 letras).');
    if (mensaje.trim().length > 2000) return setError('El mensaje es demasiado largo (máx. 2000).');
    setError('');
    setEnviando(true);
    try {
      await onEnviar({ nombre, email, motivo, mensaje });
      setEnviado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  function otroMensaje() {
    setMensaje('');
    setMotivo(MOTIVOS[0]);
    setEnviado(false);
    setError('');
  }

  if (enviado) {
    return (
      <section className="auth-pagina" aria-labelledby="contacto-ok">
        <div className="auth-tarjeta" role="status">
          <h1 id="contacto-ok">Mensaje enviado</h1>
          <p className="auth-sub">Gracias, {nombre.trim()}. Te responderemos a {email.trim()}.</p>
          <p className="cuenta-acciones">
            <button type="button" className="btn-secundario" onClick={otroMensaje}>
              Enviar otro mensaje
            </button>
            <a href="#buscar" className="btn-cta">
              Volver al buscador
            </a>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-pagina" aria-labelledby="contacto-titulo">
      <form className="auth-tarjeta" onSubmit={manejarEnvio} noValidate>
        <h1 id="contacto-titulo">Contacto</h1>
        <p className="auth-sub">Reservas, sugerencias e incidencias. Te leemos.</p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <div className="campo">
          <label htmlFor="ct-nombre">Nombre</label>
          <input id="ct-nombre" type="text" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="ct-email">Correo</label>
          <input id="ct-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="ct-motivo">Motivo</label>
          <select id="ct-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="ct-mensaje">Mensaje</label>
          <textarea
            id="ct-mensaje"
            rows="5"
            maxLength="2000"
            placeholder="¿En qué te ayudamos?"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-cta btn-grande auth-boton" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar mensaje'}
        </button>
      </form>
    </section>
  );
}
