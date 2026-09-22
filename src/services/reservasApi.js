/**
 * Reservas — colección 'reservas' en Firestore.
 * Campos: restauranteId, restauranteNombre, uid, usuarioEmail, fecha, hora, comensales, codigo, estado, createdAt
 * Controla choques de horario (ventana 90min) y capacidad por mesas.
 */
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { getDb } from './firebase.js';
import { mesasDelLocal, estaAbierto, esFestivo } from '../models/restaurantModel.js';

function minutosDeHora(horaStr){
  const [h,m]= horaStr.split(':').map(Number);
  return h*60+m;
}

function diferenciaMin(h1,h2){ return Math.abs(minutosDeHora(h1)-minutosDeHora(h2)); }

/**
 * Verifica disponibilidad consultando reservas existentes del mismo restaurante y fecha.
 * Si hay >= mesas ocupadas en ventana de 90min, no hay sitio.
 */
export async function verificarDisponibilidad(restaurante, fecha, hora, comensales){
  if (!estaAbierto(restaurante, fecha, hora)){
    const fest = esFestivo(fecha) ? 'Festivo: local cerrado.' : 'Restaurante cerrado en ese horario.';
    return { ok:false, motivo: fest };
  }
  const mesas = mesasDelLocal(restaurante);
  const rid = String(restaurante.id);
  let snapA, snapB;
  try{ snapA = await getDocs(query(collection(getDb(),'reservas'), where('restauranteId','==', rid), where('fecha','==', fecha))); }catch{ snapA={docs:[]}; }
  try{ snapB = await getDocs(query(collection(getDb(),'reservas'), where('restaurantId','==', rid), where('fecha','==', fecha))); }catch{ snapB={docs:[]}; }
  const seen = new Set();
  let coincidencias = 0;
  for (const d of [...snapA.docs, ...snapB.docs]){
    if (seen.has(d.id)) continue; seen.add(d.id);
    const r = d.data();
    if (String(r.estado).toLowerCase() === 'cancelada') continue;
    if (diferenciaMin(r.hora, hora) < 90) coincidencias += 1;
  }
  // estimar mesas necesarias: 1 mesa por cada 4 comensales
  const mesasNecesarias = Math.ceil(Number(comensales)/4) || 1;
  if (coincidencias + mesasNecesarias > mesas){
    return { ok:false, motivo: `Completo a esa hora. Mesas ocupadas: ${coincidencias}/${mesas}. Prueba otra hora.` };
  }
  return { ok:true, mesasLibres: mesas - coincidencias };
}

export async function crearReserva({ restaurante, usuario, fecha, hora, comensales }){
  if (!usuario?.uid) throw new Error('Debes iniciar sesión para reservar.');
  const verif = await verificarDisponibilidad(restaurante, fecha, hora, comensales);
  if (!verif.ok) throw new Error(verif.motivo);
  const codigo = `MIRA-${String(restaurante.id).padStart(3,'0')}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
  const rid = String(restaurante.id);
  const docRef = await addDoc(collection(getDb(),'reservas'), {
    restauranteId: rid,
    restaurantId: rid,
    restauranteNombre: restaurante.nombre,
    uid: usuario.uid,
    usuarioEmail: usuario.email,
    fecha, hora, comensales: Number(comensales),
    codigo,
    estado: 'pendiente',
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, codigo, restauranteNombre: restaurante.nombre, fecha, hora, comensales };
}

export async function listarReservasDeUsuario(usuarioId){
  const snap = await getDocs(query(collection(getDb(),'reservas'), where('uid','==', usuarioId)));
  const list = snap.docs.map(d=> ({ id:d.id, ...d.data() }));
  list.sort((a,b)=> (b.fecha||'').localeCompare(a.fecha||'') || (b.hora||'').localeCompare(a.hora||''));
  return list;
}

export async function buscarReservaPorCodigo(codigo){
  const snap = await getDocs(query(collection(getDb(),'reservas'), where('codigo','==', codigo)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id:d.id, ...d.data() };
}

export async function cancelarReserva(id){
  await deleteDoc(doc(getDb(),'reservas', id));
}
