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
import { centroDeZona } from '../services/cityCenters.js';

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
  // Sin geolocalización: la distancia es al punto más céntrico de su ciudad.
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
      if (hallado) return completarRestaurante(hallado, centroDeZona(hallado.zona));
      const crudo = await fetchRestaurantePorId(id);
      return crudo ? completarRestaurante(crudo, centroDeZona(crudo.zona)) : null;
    },
    [datos],
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

  // Distancia al centro de su ciudad (sin geolocalización); acento y media siempre.
  const conDistancia = useMemo(
    () => datos.map((r) => completarRestaurante(r, centroDeZona(r.zona))),
    [datos],
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
    geoEstado: 'centro',
    distanciaDisponible: true,
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
