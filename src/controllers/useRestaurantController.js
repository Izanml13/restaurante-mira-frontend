/**
 * Controller — hook que orquesta estado, Model y Views.
 * Ahorro de lecturas: sin filtros (orden Relevancia/Valoración) la portada se
 * pagina de 21 en 21 con scroll infinito; cualquier filtro u orden global
 * trae el conjunto entero UNA vez. La View solo recibe props + callbacks.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  fetchPrimeraPagina,
  fetchSiguientePagina,
  fetchRestaurantePorId,
  contarRestaurantes,
} from '../services/restaurantApi.js';
import { filterRestaurants, sortRestaurants } from '../services/filterService.js';
import { completarRestaurante, dietaActiva, accesibilidadActiva, ZONAS_CATALUNA } from '../models/restaurantModel.js';

const FILTROS_INICIALES = {
  q: '',
  precio: '',
  cocina: '',
  zona: '',
  distanciaMax: '',
  orden: 'Relevancia',
  dia: '',
  franja: '',
  hora: '',
};

export function useRestaurantController({ dieta = null, accesibilidad = null } = {}) {
  const [datos, setDatos] = useState([]); // docs cargados (tanda(s) o todo)
  const [modo, setModo] = useState('pagina'); // pagina | todo
  const [cursor, setCursor] = useState(null);
  const [hayMas, setHayMas] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [total, setTotal] = useState(0); // count() barato, 1 vez
  const [estado, setEstado] = useState('cargando'); // cargando | listo | error
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [posicion, setPosicion] = useState(null); // { lat, lng } | null
  const [geoEstado, setGeoEstado] = useState('pendiente'); // pendiente | ok | denegado | no-soportado
  const [seleccionado, setSeleccionado] = useState(null); // Restaurant | null (modal detalle)
  const [libro, setLibro] = useState(null); // Restaurant | null (modal carta libro)
  const [ignorarDieta, setIgnorarDieta] = useState(false); // ver todo igual (solo sesión)
  const reqId = useRef(0); // evita que una carga vieja pise a la nueva

  // Total barato (agregado) + recarga con Reintentar.
  useEffect(() => {
    let vivo = true;
    contarRestaurantes()
      .then((n) => {
        if (vivo) setTotal(n);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [intento]);

  // Carga paginada: siempre trae tandas de 21, sin importar filtros.
  // Los filtros se aplican en cliente sobre lo ya cargado.
  useEffect(() => {
    let vivo = true;
    const id = ++reqId.current;
    setModo('pagina');
    setEstado('cargando');
    setError('');
    setCursor(null);
    setHayMas(true);
    setCargandoMas(false);
    fetchPrimeraPagina()
      .then((pg) => {
        if (!vivo || id !== reqId.current) return;
        setCursor(pg.cursor);
        setHayMas(!pg.terminado);
        setDatos(pg.items);
        setEstado('listo');
      })
      .catch((e) => {
        if (!vivo || id !== reqId.current) return;
        setError(e.message);
        setEstado('error');
      });
    return () => {
      vivo = false;
    };
  }, [filtros, intento]);

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

  // Cierra el modal con Escape (si el libro está abierto, él gestiona su propio Escape).
  useEffect(() => {
    if (!seleccionado || libro) return undefined;
    function alTeclar(e) {
      if (e.key === 'Escape') setSeleccionado(null);
    }
    window.addEventListener('keydown', alTeclar);
    return () => window.removeEventListener('keydown', alTeclar);
  }, [seleccionado, libro]);

  /** Siguiente tanda del scroll infinito (solo modo portada). */
  async function cargarMas() {
    if (modo !== 'pagina' || !hayMas || cargandoMas || !cursor) return;
    setCargandoMas(true);
    try {
      const pg = await fetchSiguientePagina(cursor);
      setCursor(pg.cursor);
      setHayMas(!pg.terminado);
      setDatos((prev) => {
        const ids = new Set(prev.map((r) => r.id));
        return [...prev, ...pg.items.filter((r) => !ids.has(r.id))];
      });
    } catch {
      setHayMas(false);
    } finally {
      setCargandoMas(false);
    }
  }

  /** Un restaurante por id: de memoria si está, si no 1 lectura. Estable para effects. */
  const obtenerRestaurante = useCallback(
    async (id) => {
      const hallado = datos.find((r) => String(r.id) === String(id));
      if (hallado) return completarRestaurante(hallado, posicion);
      const crudo = await fetchRestaurantePorId(id);
      return crudo ? completarRestaurante(crudo, posicion) : null;
    },
    [datos, posicion],
  );

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
    () => datos.map((r) => completarRestaurante(r, posicion)),
    [datos, posicion],
  );

  // Opciones sacadas de los datos reales (cocinas y zonas de Yelp).
  const cocinasDisponibles = useMemo(
    () => [...new Set(datos.map((r) => r.cocina))].sort((a, b) => a.localeCompare(b, 'es')),
    [datos],
  );
  const zonasDisponibles = useMemo(
    () =>
      [...new Set([...ZONAS_CATALUNA, ...datos.map((r) => r.zona).filter(Boolean)])].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [datos],
  );

  const filtrados = useMemo(() => {
    const dietaEfectiva = ignorarDieta ? null : dieta;
    const accEfectiva = ignorarDieta ? null : accesibilidad;
    const base = filterRestaurants(conDistancia, { ...filtros, dieta: dietaEfectiva, accesibilidad: accEfectiva });
    // Si zona es tu-ubicación, ordenar por distancia automáticamente si orden es Relevancia
    if (filtros.zona === '__tu-ubicacion' && filtros.orden === 'Relevancia') {
      return sortRestaurants(base, 'Distancia');
    }
    return sortRestaurants(base, filtros.orden);
  }, [conDistancia, filtros, dieta, accesibilidad, ignorarDieta]);

  // Locales ocultos SOLO por preferencias (dieta o accesibilidad). Se comparan
  // con y sin ellas para el aviso.
  const ocultosDieta = useMemo(() => {
    if ((!dietaActiva(dieta) && !accesibilidadActiva(accesibilidad)) || ignorarDieta) return 0;
    const sinPrefs = filterRestaurants(conDistancia, { ...filtros, dieta: null, accesibilidad: null });
    return Math.max(0, sinPrefs.length - filtrados.length);
  }, [conDistancia, filtros, dieta, accesibilidad, ignorarDieta, filtrados.length]);

  // Nota: la dieta es preferencia de perfil (se cambia en Mi cuenta),
  // no filtro del buscador: no entra en hayFiltrosActivos ni lo borra Limpiar.
  const hayFiltrosActivos =
    filtros.q !== '' ||
    filtros.precio !== '' ||
    filtros.cocina !== '' ||
    filtros.zona !== '' ||
    filtros.distanciaMax !== '' ||
    filtros.orden !== 'Relevancia' ||
    filtros.dia !== '' ||
    filtros.franja !== '' ||
    filtros.hora !== '';

  return {
    filtros,
    filtrados,
    todos: conDistancia, // sin filtrar (para favoritos y comparador)
    total: total || datos.length, // si el count falla sin red, usa lo cargado
    modo,
    hayMas,
    cargandoMas,
    cargarMas,
    estado,
    error,
    geoEstado,
    distanciaDisponible: geoEstado === 'ok',
    cocinasDisponibles,
    zonasDisponibles,
    seleccionado,
    libro,
    ocultosDieta,
    ignorarDieta,
    hayFiltrosActivos,
    actualizarFiltro,
    elegirCocina,
    limpiarFiltros,
    recargar,
    abrirDetalle: setSeleccionado,
    cerrarDetalle: () => setSeleccionado(null),
    abrirCarta: setLibro,
    cerrarCarta: () => setLibro(null),
    verTodosIgual: () => setIgnorarDieta(true),
    obtenerRestaurante,
  };
}
