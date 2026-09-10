/** View pura: formulario para que una cuenta empresa proponga su local. */
import { useState } from 'react';
import { ZONAS_CATALUNA } from '../models/restaurantModel.js';

const TRI = [
  { value: '', label: 'No lo sé' },
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
];
const triABooleano = (v) => (v === 'si' ? true : v === 'no' ? false : null);

export default function Negocio({ usuario, perfil, onProponer }) {
  const [form, setForm] = useState({
    nombre: '',
    ciudad: '',
    zona: '',
    direccion: '',
    telefono: '',
    categorias: '',
    precio: '€€',
    descripcion: '',
    imagen_url: '',
    acceso: '',
    infantil: '',
    alergenos: '',
  });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  if (!usuario) {
    window.location.hash = '#/login';
    return null;
  }
  if (perfil && perfil.tipo !== 'empresa') {
    return (
      <section className="auth-pagina" aria-labelledby="negocio-no">
        <div className="auth-tarjeta" role="status">
          <h1 id="negocio-no">Solo empresas</h1>
          <p className="auth-sub">
            Esta página es para cuentas de empresa. Tienes cuenta de cliente.
          </p>
          <p>
            <a href="#buscar">Volver al buscador</a>
          </p>
        </div>
      </section>
    );
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await onProponer({
        usuario,
        datos: {
          ...form,
          categorias: form.categorias.split(',').map((c) => c.trim()).filter(Boolean).slice(0, 3),
          accesoDiscapacidad: triABooleano(form.acceso),
          menuInfantil: triABooleano(form.infantil),
        },
      });
      setEnviado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <section className="auth-pagina" aria-labelledby="negocio-ok">
        <div className="auth-tarjeta" role="status">
          <h1 id="negocio-ok">Propuesta enviada</h1>
          <p className="auth-sub">
            Revisaremos <strong>{form.nombre}</strong> y la publicaremos si todo está
            correcto. Te avisaremos a tu correo.
          </p>
          <p>
            <a href="#buscar">Volver al buscador</a>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-pagina" aria-labelledby="negocio-titulo">
      <form className="auth-tarjeta tarjeta-ancha" onSubmit={manejarEnvio} noValidate>
        <h1 id="negocio-titulo">Añade tu restaurante</h1>
        <p className="auth-sub">Lo revisaremos antes de publicarlo en la guía.</p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <div className="campo">
          <label htmlFor="ng-nombre">Nombre del local *</label>
          <input id="ng-nombre" type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="ng-ciudad">Ciudad *</label>
          <input id="ng-ciudad" type="text" placeholder="Tarragona" value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="ng-zona">Zona *</label>
          <select id="ng-zona" value={form.zona} onChange={(e) => set('zona', e.target.value)}>
            <option value="">Elige zona</option>
            {ZONAS_CATALUNA.map((z) => (
              <option key={z} value={z}>
                {z.replace(', Spain', '')}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="ng-dir">Dirección *</label>
          <input id="ng-dir" type="text" value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="ng-tel">Teléfono</label>
          <input id="ng-tel" type="tel" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="ng-cat">Cocinas (separadas por comas, máx. 3) *</label>
          <input id="ng-cat" type="text" placeholder="Mediterránea, Tapas" value={form.categorias} onChange={(e) => set('categorias', e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="ng-precio">Precio</label>
          <select id="ng-precio" value={form.precio} onChange={(e) => set('precio', e.target.value)}>
            <option value="€">€ · económico</option>
            <option value="€€">€€ · medio</option>
            <option value="€€€">€€€ · alto</option>
          </select>
        </div>
        <div className="campo">
          <label htmlFor="ng-desc">Descripción</label>
          <textarea id="ng-desc" rows="3" maxLength="500" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="ng-foto">Foto (URL, opcional)</label>
          <input id="ng-foto" type="url" placeholder="https://…" value={form.imagen_url} onChange={(e) => set('imagen_url', e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="ng-acceso">Acceso adaptado (silla de ruedas)</label>
          <select id="ng-acceso" value={form.acceso} onChange={(e) => set('acceso', e.target.value)}>
            {TRI.map((t) => (
              <option key={t.label} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="ng-infantil">Menú infantil</label>
          <select id="ng-infantil" value={form.infantil} onChange={(e) => set('infantil', e.target.value)}>
            {TRI.map((t) => (
              <option key={t.label} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="ng-alerg">Alérgenos (opcional)</label>
          <textarea id="ng-alerg" rows="2" maxLength="500" placeholder="Ej: disponemos de pan sin gluten; cocina con frutos secos…" value={form.alergenos} onChange={(e) => set('alergenos', e.target.value)} />
        </div>
        <button type="submit" className="btn-cta btn-grande auth-boton" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Proponer restaurante'}
        </button>
      </form>
    </section>
  );
}
