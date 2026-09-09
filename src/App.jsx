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
import PromoBanner from './components/PromoBanner.jsx';
import Footer from './components/Footer.jsx';
import { enviarContacto } from './services/contactoApi.js';
import './App.css';

function rutaActual() {
  const h = window.location.hash;
  if (h === '#/login') return 'login';
  if (h === '#/registro') return 'registro';
  if (h === '#/cuenta') return 'cuenta';
  if (h === '#/contacto') return 'contacto';
  return 'home';
}

export default function App() {
  const {
    filtros,
    filtrados,
    total,
    estado,
    error,
    geoEstado,
    distanciaDisponible,
    cocinasDisponibles,
    zonasDisponibles,
    seleccionado,
    hayFiltrosActivos,
    actualizarFiltro,
    elegirCocina,
    limpiarFiltros,
    recargar,
    abrirDetalle,
    cerrarDetalle,
  } = useRestaurantController();
  const { usuario, crearCuenta, iniciarSesion, cerrarSesion } = useAuth();
  const [ruta, setRuta] = useState(rutaActual);

  useEffect(() => {
    function alCambiarHash() {
      setRuta(rutaActual());
      window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', alCambiarHash);
    return () => window.removeEventListener('hashchange', alCambiarHash);
  }, []);

  function buscarZona(cocina) {
    elegirCocina(cocina);
    document.getElementById('buscar')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function salir() {
    await cerrarSesion();
    window.location.hash = '#/';
  }

  return (
    <>
      <a className="skip-link" href="#buscar">
        Saltar al buscador
      </a>
      <Header usuario={usuario} onSalir={salir} />
      <main>
        {ruta === 'login' && <Login onLogin={iniciarSesion} yaTieneSesion={Boolean(usuario)} />}
        {ruta === 'registro' && (
          <Registro onRegistro={crearCuenta} yaTieneSesion={Boolean(usuario)} />
        )}
        {ruta === 'cuenta' && <Cuenta usuario={usuario} onSalir={salir} />}
        {ruta === 'contacto' && <Contacto usuario={usuario} onEnviar={enviarContacto} />}
        {ruta === 'home' && (
          <>
            <Hero onPickCocina={buscarZona} total={total} numZonas={zonasDisponibles.length} />
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
                    onChange={actualizarFiltro}
                    onClear={limpiarFiltros}
                  />
                  {geoEstado !== 'ok' && (
                    <p className="aviso">
                      Sin tu ubicación no podemos calcular distancias: el filtro de distancia está
                      desactivado. Actívala en el navegador para ver a cuántos km está cada sitio.
                    </p>
                  )}
                  <p aria-live="polite" className="contador">
                    {filtrados.length} de {total}{' '}
                    {filtrados.length === 1 ? 'restaurante' : 'restaurantes'}
                  </p>
                  <RestaurantList
                    restaurants={filtrados}
                    onClear={limpiarFiltros}
                    onSelect={abrirDetalle}
                  />
                </>
              )}
            </section>
            <PromoBanner />
          </>
        )}
      </main>
      <Footer />
      {seleccionado && <RestaurantDetail restaurant={seleccionado} onClose={cerrarDetalle} />}
    </>
  );
}
