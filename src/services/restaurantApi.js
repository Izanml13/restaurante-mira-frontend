/**
 * Model — lectura de la colección 'restaurants' de Firestore.
 * NOTA: el SDK web no soporta proyección de campos (select), así que cada
 * doc viaja completo con sus 50 reseñas (~15 KB/doc, ~10 MB por carga total).
 * Si el tráfico crece, el paso natural es mover 'resenas' a una subcolección
 * y traerla solo al abrir el detalle (ver README).
 */
import { collection, getDocs, getDoc, doc, query, orderBy, limit, startAfter, getCountFromServer } from 'firebase/firestore';
import { getDb } from './firebase.js';

/** Restaurantes por tanda en la portada (scroll infinito). */
export const TAMANO_PAGINA = 21;
import { imagenParaRestaurante } from '../models/restaurantModel.js';

const PRECIOS_VALIDOS = ['€', '€€', '€€€'];

function mapearDoc(id, d) {
  const categorias = Array.isArray(d.categorias) ? d.categorias : [];
  const resenas = Array.isArray(d.resenas) ? d.resenas : [];
  return {
    id,
    nombre: d.nombre ?? 'Sin nombre',
    cocina: categorias[0] ?? 'Mediterránea',
    categorias,
    precio: PRECIOS_VALIDOS.includes(d.precio) ? d.precio : '€€',
    distanciaKm: null, // se calcula en el Controller con tu ubicación
    coords:
      typeof d.coordenadas?.latitud === 'number' && typeof d.coordenadas?.longitud === 'number'
        ? { lat: d.coordenadas.latitud, lng: d.coordenadas.longitud }
        : null,
    valoracion: typeof d.rating_yelp === 'number' ? d.rating_yelp : 0,
    totalResenasYelp: d.total_resenas_yelp ?? 0,
    imagen: d.imagen_url || imagenParaRestaurante(categorias[0] ?? 'Mediterránea', id),
    descripcion:
      d.descripcion ||
      [categorias.join(' · '), d.direccion_completa || d.ciudad].filter(Boolean).join(' — ') ||
      'Restaurante recomendado por la guía MIRA.',
    direccion: d.direccion_completa || d.direccion || '',
    ciudad: d.ciudad || '',
    zona: d.zona_busqueda || '',
    telefono: d.telefono || '',
    yelpUrl: d.yelp_url || '',
    // La empresa los rellena en su formulario; en los 690 de Yelp no existen (null).
    accesoDiscapacidad: d.accesoDiscapacidad ?? null, // true | false | null (sin info)
    menuInfantil: d.menuInfantil ?? null, // true | false | null (sin info)
    tronas: d.tronas ?? null, // sillas de bebé: true | false | null (sin info)
    entornoTranquilo: d.entornoTranquilo ?? null, // true | false | null (sin info)
    terraza: d.terraza ?? null, // true | false | null (sin info)
    alergenos: d.alergenos || '', // texto libre del local; vacío = sin información
    resenas, // 50 reseñas sintéticas para el detalle
  };
}

/**
 * Descarga TODA la colección (1 lectura por doc, ~690 en Cataluña).
 * Solo para vistas que necesitan el conjunto global (filtros/orden).
 * El filtrado posterior es 100% cliente, como exige el brief.
 * @returns {Promise<import('../models/restaurantModel.js').Restaurant[]>}
 */
export async function fetchRestaurants() {
  const snap = await getDocs(collection(getDb(), 'restaurants'));
  return snap.docs.map((doc) => mapearDoc(doc.id, doc.data()));
}

// Portada ordenada por nota. Solo UN orderBy: usa el índice automático sin
// composite. Los empates los resuelve el cursor (snapshot completo, preciso).
function consultaPortada(cursor = null) {
  const partes = [collection(getDb(), 'restaurants'), orderBy('rating_yelp', 'desc')];
  if (cursor) partes.push(startAfter(cursor));
  partes.push(limit(TAMANO_PAGINA));
  return query(...partes);
}

function empaquetarPagina(snap) {
  const items = snap.docs.map((doc) => mapearDoc(doc.id, doc.data()));
  return {
    items,
    cursor: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
    terminado: snap.docs.length < TAMANO_PAGINA,
  };
}

/** Primera tanda de la portada (21 lecturas). */
export async function fetchPrimeraPagina() {
  return empaquetarPagina(await getDocs(consultaPortada()));
}

/** Siguiente tanda tras el cursor (21 lecturas). */
export async function fetchSiguientePagina(cursor) {
  if (!cursor) return { items: [], cursor: null, terminado: true };
  return empaquetarPagina(await getDocs(consultaPortada(cursor)));
}

/** Total de docs (agregado barato: ~1 lectura por cada 1000). */
export async function contarRestaurantes() {
  return (await getCountFromServer(collection(getDb(), 'restaurants'))).data().count;
}

/**
 * Un restaurante por id (1 lectura). Para favoritos guardados aún no cargados.
 * Devuelve null si no existe.
 */
export async function fetchRestaurantePorId(id) {
  const snap = await getDoc(doc(getDb(), 'restaurants', String(id)));
  if (!snap.exists()) return null;
  return mapearDoc(snap.id, snap.data());
}
