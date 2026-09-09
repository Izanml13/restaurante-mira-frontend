/**
 * Model — lectura de la colección 'restaurants' de Firestore.
 * NOTA: el SDK web no soporta proyección de campos (select), así que cada
 * doc viaja completo con sus 50 reseñas (~15 KB/doc, ~10 MB por carga total).
 * Si el tráfico crece, el paso natural es mover 'resenas' a una subcolección
 * y traerla solo al abrir el detalle (ver README).
 */
import { collection, getDocs } from 'firebase/firestore';
import { getDb } from './firebase.js';

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
    imagen: d.imagen_url || `https://picsum.photos/seed/${id}/600/400`,
    descripcion:
      [categorias.join(' · '), d.direccion_completa || d.ciudad].filter(Boolean).join(' — ') ||
      'Restaurante recomendado por la guía MIRA.',
    direccion: d.direccion_completa || d.direccion || '',
    ciudad: d.ciudad || '',
    zona: d.zona_busqueda || '',
    telefono: d.telefono || '',
    yelpUrl: d.yelp_url || '',
    resenas, // 50 reseñas sintéticas para el detalle
  };
}

/**
 * Descarga TODA la colección (1 lectura por doc, ~690 en Cataluña).
 * El filtrado posterior es 100% cliente, como exige el brief.
 * @returns {Promise<import('../models/restaurantModel.js').Restaurant[]>}
 */
export async function fetchRestaurants() {
  const snap = await getDocs(collection(getDb(), 'restaurants'));
  return snap.docs.map((doc) => mapearDoc(doc.id, doc.data()));
}
