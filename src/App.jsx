/**
 * Controller-orquestador: monta la landing y la sección del buscador,
 * más las rutas '#/login' y '#/registro' (hash routing sin dependencias).
 * Es el único que habla con los Controllers (hooks); las Views reciben props.
 */
import { useEffect, useState } from 'react';
import { useRestaurantController } from './controllers/useRestaurantController.js';
import { useAuth } from './controllers/useAuth.js';
import { PRECIOS, DISTANCIAS, ORDENES } from './models/restaurantModel.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import SearchBar from './components/SearchBar.jsx';
import RestaurantList from './components/RestaurantList.jsx';
import RestaurantDetail from './components/RestaurantDetail.jsx';
import Login from './components/Login.jsx';
import Registro from './components/Registro.jsx';
import Cuenta from './components/Cuenta.jsx';
import Contacto from './components/Contacto.jsx';
import Reservas from './components/Reservas.jsx';
import Admin from './components/Admin.jsx';
import Negocio from './components/Negocio.jsx';
import Favoritos from './components/Favoritos.jsx';
import LibroCarta from './components/LibroCarta.jsx';
import PromoBanner from './components/PromoBanner.jsx';
import Footer from './components/Footer.jsx';
import { enviarContacto } from './services/contactoApi.js';
import { proponerNegocio } from './services/negocioApi.js';
import './App.css';

function rutaActual() {
  const h = window.location.hash;
  if (h === '#/login') return 'login';
  if (h === '#/registro') return 'registro';
  if (h === '#/cuenta') return 'cuenta';
  if (h === '#/contacto') return 'contacto';
  if (h === '#/reservas') return 'reservas';
  if (h === '#/admin') return 'admin';
  if (h === '#/negocio') return 'negocio';
  if (h === '#/favoritos') return 'favoritos';
  return 'home';
}

export default function App() {
  const { usuario, crearCuenta, iniciarSesion, cerrarSesion, esAdmin, perfil, recargarPerfil, dieta, guardarDieta, accesibilidad, guardarAccesibilidad, favoritos, toggleFavorito } = useAuth();
  const [tema, setTema] = useState(() => {
    try {
      const guardado = localStorage.getItem('mira:tema');
      if (guardado === 'claro' || guardado === 'oscuro') return guardado;
    } catch {
      /* sin almacenamiento: se usa el sistema */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  });

  useEffect(() => {
    if (tema === 'oscuro') {
      document.documentElement.dataset.theme = 'dark';
    } else {
      delete document.documentElement.dataset.theme;
    }
    try {
      localStorage.setItem('mira:tema', tema);
    } catch {
      /* sin almacenamiento: solo sesión */
    }
  }, [tema]);

  const {
    filtros,
    filtrados,
    todos,
    total,
    modo,
    hayMas,
    cargandoMas,
    cargarMas,
    estado,
    error,
    geoEstado,
    distanciaDisponible,
    cocinasDisponibles,
    zonasDisponibles,
    seleccionado,
    libro,
    ocultosDieta,
    ignorarDieta,
    hayFiltrosActivos,
    actualizarFiltro,
    limpiarFiltros,
    recargar,
    abrirDetalle,
    cerrarDetalle,
    abrirCarta,
    cerrarCarta,
    verTodosIgual,
    obtenerRestaurante,
    elegirCocina,
  } = useRestaurantController({ dieta, accesibilidad });
  const [ruta, setRuta] = useState(rutaActual);

  useEffect(() => {
    function alCambiarHash() {
      setRuta(rutaActual());
      window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', alCambiarHash);
    return () => window.removeEventListener('hashchange', alCambiarHash);
  }, []);

  async function salir() {
    await cerrarSesion();
    window.location.hash = '#/';
  }

  return (
    <>
      <a className="skip-link" href="#buscar">
        Saltar al buscador
      </a>
      <Header usuario={usuario} esAdmin={esAdmin} perfil={perfil} numFavoritos={favoritos.length} tema={tema} onCambiarTema={() => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'))} onSalir={salir} />
      <main>
        {ruta === 'login' && <Login onLogin={iniciarSesion} yaTieneSesion={Boolean(usuario)} />}
        {ruta === 'registro' && (
          <Registro onRegistro={crearCuenta} yaTieneSesion={Boolean(usuario)} />
        )}
        {ruta === 'cuenta' && <Cuenta usuario={usuario} perfil={perfil} dieta={dieta} guardarDieta={guardarDieta} accesibilidad={accesibilidad} guardarAccesibilidad={guardarAccesibilidad} onSalir={salir} />}
        {ruta === 'contacto' && <Contacto usuario={usuario} onEnviar={enviarContacto} />}
        {ruta === 'reservas' && <Reservas usuario={usuario} esAdmin={esAdmin} />}
        {ruta === 'admin' && <Admin usuario={usuario} esAdmin={esAdmin} />}
        {ruta === 'negocio' && <Negocio usuario={usuario} perfil={perfil} onProponer={proponerNegocio} />}
        {ruta === 'favoritos' && (
          <Favoritos
            ids={favoritos}
            todos={todos}
            dieta={dieta}
            onObtenerRestaurante={obtenerRestaurante}
            onVerCarta={abrirCarta}
            onReservar={abrirDetalle}
            onToggleFavorito={toggleFavorito}
          />
        )}
        {ruta === 'home' && (
          <>
            <Hero total={total} numZonas={zonasDisponibles.length} />
            <section id="buscar" className="buscar" aria-labelledby="buscar-titulo">
              <h2 id="buscar-titulo" className="buscar-titulo">
                Busca tu sitio
              </h2>

              {estado === 'cargando' && (
                <p className="cargando" role="status">
                  Cargando restaurantes…
                </p>
              )}

              {estado === 'error' && (
                <div className="error-panel" role="alert">
                  <p className="vacio-titulo">No se pudo conectar con la base de datos.</p>
                  <p>{error}</p>
                  <button type="button" className="btn-cta" onClick={recargar}>
                    Reintentar
                  </button>
                </div>
              )}

              {estado === 'listo' && (
                <>
                  <SearchBar
                    filtros={filtros}
                    opciones={{
                      cocinas: cocinasDisponibles,
                      zonas: zonasDisponibles,
                      precios: PRECIOS,
                      distancias: DISTANCIAS,
                      ordenes: ORDENES,
                    }}
                    hayFiltrosActivos={hayFiltrosActivos}
                    distanciaDisponible={distanciaDisponible}
                    geoEstado={geoEstado}
                    onChange={actualizarFiltro}
                    onClear={limpiarFiltros}
                  />

                  <p aria-live="polite" className="contador">
                    {modo === 'pagina'
                      ? `Mostrando ${filtrados.length} de ${total} restaurantes`
                      : `${filtrados.length} de ${total} ${filtrados.length === 1 ? 'restaurante' : 'restaurantes'}`}
                    {filtros.q && ` para "${filtros.q}"`}
                  </p>
                  {ocultosDieta > 0 && !ignorarDieta && (
                    <p className="aviso">
                      {ocultosDieta} {ocultosDieta === 1 ? 'local oculto' : 'locales ocultos'} por tu
                      dieta o accesibilidad.{' '}
                      <a href="#/cuenta">Cambiar en Mi cuenta</a> ·{' '}
                      <button type="button" className="btn-texto" onClick={verTodosIgual}>
                        Ver todos igual
                      </button>
                    </p>
                  )}
                  <RestaurantList
                    restaurants={filtrados}
                    filtros={filtros}
                    onClear={limpiarFiltros}
                    onSelect={abrirDetalle}
                    hayMas={modo === 'pagina' && hayMas}
                    cargandoMas={cargandoMas}
                    onLoadMore={cargarMas}
                    esFavorito={(id) => favoritos.includes(id)}
                    onToggleFavorito={toggleFavorito}
                    onVerCarta={abrirCarta}
                  />
                </>
              )}
            </section>
            <PromoBanner />
          </>
        )}
      </main>
      <Footer />
      {seleccionado && <RestaurantDetail restaurant={seleccionado} usuario={usuario} onClose={cerrarDetalle} onVerCarta={abrirCarta} />}
      {libro && <LibroCarta restaurant={libro} dieta={dieta} onClose={cerrarCarta} />}
    </>
  );
}
