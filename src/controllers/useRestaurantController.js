/**
 * Controller — hook que orquesta estado, Model y Views.
 * Fuente de datos: Firestore (restaurantApi). Geolocalización opcional
 * para calcular distancias; sin ella, el filtro de distancia se ignora.
 * También guarda qué restaurante está abierto en el modal de detalle.
 * La View solo recibe props + callbacks; nunca importa el Model directamente.
 */
import { useEffect, useMemo, useState } from 'react';
import { fetchRestaurants } from '../services/restaurantApi.js';
import { filterRestaurants, sortRestaurants } from '../services/filterService.js';
import { haversineKm, acentoCocina, mediaResenas } from '../models/restaurantModel.js';

const FILTROS_INICIALES = {
  q: '',
  precio: '',
  cocina: '',
  zona: '',
  distanciaMax: '',
  orden: 'Relevancia',
};

export function useRestaurantController() {
  const [datos, setDatos] = useState([]);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | error
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [posicion, setPosicion] = useState(null); // { lat, lng } | null
  const [geoEstado, setGeoEstado] = useState('pendiente'); // pendiente | ok | denegado | no-soportado
  const [seleccionado, setSeleccionado] = useState(null); // Restaurant | null (modal detalle)

  // Carga inicial desde Firestore (1 lectura por restaurante).
  useEffect(() => {
    let vivo = true;
    setEstado('cargando');
    fetchRestaurants()
      .then((list) => {
        if (vivo) setDatos(list);
        if (vivo) setEstado('listo');
      })
      .catch((e) => {
        if (!vivo) return;
        setError(e.message);
        setEstado('error');
      });
    return () => {
      vivo = false;
    };
  }, [intento]);

  // Ubicación del usuario (opcional, no bloquea la carga).
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoEstado('no-soportado');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosicion({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoEstado('ok');
      },
      () => setGeoEstado('denegado'),
      { timeout: 8000, maximumAge: 600000 },
    );
  }, []);

  // Cierra el modal con Escape.
  useEffect(() => {
    if (!seleccionado) return undefined;
    function alTeclar(e) {
      if (e.key === 'Escape') setSeleccionado(null);
    }
    window.addEventListener('keydown', alTeclar);
    return () => window.removeEventListener('keydown', alTeclar);
  }, [seleccionado]);

  /** Actualiza un solo campo del filtro (lo usa SearchBar en cada onChange). */
  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  /** Atajo del Hero: elige cocina y baja al buscador. */
  function elegirCocina(cocina) {
    setFiltros((prev) => ({ ...prev, cocina }));
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
  }

  function recargar() {
    setIntento((i) => i + 1);
  }

  // Distancias reales si hay ubicación; acento y media siempre (los pinta la View).
  const conDistancia = useMemo(
    () =>
      datos.map((r) => ({
        ...r,
        distanciaKm:
          r.coords && posicion
            ? haversineKm(posicion.lat, posicion.lng, r.coords.lat, r.coords.lng)
            : null,
        acento: acentoCocina(r.cocina),
        media: mediaResenas(r),
      })),
    [datos, posicion],
  );

  // Opciones sacadas de los datos reales (cocinas y zonas de Yelp).
  const cocinasDisponibles = useMemo(
    () => [...new Set(datos.map((r) => r.cocina))].sort((a, b) => a.localeCompare(b, 'es')),
    [datos],
  );
  const zonasDisponibles = useMemo(
    () =>
      [...new Set(datos.map((r) => r.zona).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [datos],
  );

  const filtrados = useMemo(() => {
    const base = filterRestaurants(conDistancia, filtros);
    return sortRestaurants(base, filtros.orden);
  }, [conDistancia, filtros]);

  const hayFiltrosActivos =
    filtros.q !== '' ||
    filtros.precio !== '' ||
    filtros.cocina !== '' ||
    filtros.zona !== '' ||
    filtros.distanciaMax !== '' ||
    filtros.orden !== 'Relevancia';

  return {
    filtros,
    filtrados,
    total: datos.length,
    estado,
    error,
    geoEstado,
    distanciaDisponible: geoEstado === 'ok',
    cocinasDisponibles,
    zonasDisponibles,
    seleccionado,
    hayFiltrosActivos,
    actualizarFiltro,
    elegirCocina,
    limpiarFiltros,
    recargar,
    abrirDetalle: setSeleccionado,
    cerrarDetalle: () => setSeleccionado(null),
  };
}
