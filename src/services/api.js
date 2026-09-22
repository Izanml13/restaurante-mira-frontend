import { getAuth } from 'firebase/auth';
import {
  doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, startAfter,
  Timestamp, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { getDb, getFirebaseApp } from './firebase.js';

const db = getDb();

function getUser() {
  const auth = getAuth(getFirebaseApp());
  return auth.currentUser;
}

async function requireUser() {
  const u = getUser();
  if (!u) throw new Error('No autenticado');
  return u;
}

/* ────────────── POINTS ────────────── */

function calcRachaLogin(data) {
  const hoy = new Date().toISOString().split('T')[0];
  const ultimo = data.ultimoLoginDate || null;
  if (ultimo === hoy) return { dias: Math.min(data.rachaLoginDias || 0, 7), ultimoLogin: ultimo, graceUsados: data.graceUsados || 0, yaReclamado: true };
  const anterior = new Date(ultimo || hoy);
  const diff = Math.floor((new Date(hoy) - anterior) / 86400000);
  let dias = Math.min(data.rachaLoginDias || 0, 7);
  let grace = data.graceUsados || 0;
  if (diff === 1) {
    dias += 1;
  } else if (diff === 2 && grace < 2) {
    grace += 1;
  } else {
    dias = 1;
    if (diff > 2) grace = 0;
  }
  dias = Math.min(dias, 7);
  const dia7Disponible = dias >= 7;
  const pts = dia7Disponible ? 0 : Math.min(5 + 3 * Math.max(0, dias - 1), 15);
  return { dias, ultimoLogin: hoy, graceUsados: grace, puntos: pts, yaReclamado: false, dia7Disponible };
}

const WHEEL_PRIZES = [
  { puntos: 20, label: '20 MIRA', peso: 475 },
  { puntos: 25, label: '25 MIRA', peso: 200 },
  { puntos: 30, label: '30 MIRA', peso: 150 },
  { puntos: 50, label: '50 MIRA', peso: 120 },
  { puntos: 100, label: '100 MIRA', peso: 5 },
];

function spinWheel() {
  const totalPeso = WHEEL_PRIZES.reduce((s, p) => s + p.peso, 0);
  let rand = Math.random() * totalPeso;
  for (const prize of WHEEL_PRIZES) {
    rand -= prize.peso;
    if (rand <= 0) return prize;
  }
  return WHEEL_PRIZES[0];
}

export const pointsApi = {
  isNewUser: async () => {
    const u = await requireUser();
    const snap = await getDoc(doc(db, 'usuarios', u.uid));
    const d = snap.data() || {};
    return !d.ultimoLoginDate && (d.rachaLoginDias || 0) === 0;
  },

  getBalance: async () => {
    const u = await requireUser();
    const snap = await getDoc(doc(db, 'usuarios', u.uid));
    const d = snap.data() || {};
    const racha = calcRachaLogin(d);
    return {
      saldoActual: d.saldoPuntos || 0,
      totalAcumulado: d.totalAcumulado || 0,
      totalCanjeado: d.totalCanjeado || 0,
      rachaLogin: { dias: racha.dias, ultimoLogin: racha.ultimoLogin, graceUsados: racha.graceUsados, yaReclamado: racha.yaReclamado },
      rachaReservas: { semanasConsecutivas: d.rachaReservasSemanas || 0, multiplicador: d.rachaReservasMultiplicador || 1 },
    };
  },

  getLedger: async (params = {}) => {
    const u = await requireUser();
    const constraints = [where('uid', '==', u.uid), orderBy('createdAt', 'desc')];
    if (params.tipo) constraints.splice(1, 0, where('tipo', '==', params.tipo));
    const q = query(collection(db, 'puntos_movimientos'), ...constraints, limit(Number(params.limit) || 20));
    const snap = await getDocs(q);
    return { data: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  },

  dailyLogin: async () => {
    const u = await requireUser();
    const ref = doc(db, 'usuarios', u.uid);
    const snap = await getDoc(ref);
    const d = snap.data() || {};
    console.log('[dailyLogin] doc exists:', snap.exists(), 'data keys:', Object.keys(d));
    const racha = calcRachaLogin(d);
    if (racha.yaReclamado) return { yaReclamado: true, puntos: 0, racha };
    if (racha.dia7Disponible) {
      await setDoc(ref, {
        saldoPuntos: d.saldoPuntos || 0,
        totalAcumulado: d.totalAcumulado || 0,
        rachaLoginDias: racha.dias,
        ultimoLoginDate: racha.ultimoLogin,
        graceUsados: racha.graceUsados,
      }, { merge: true });
      return { yaReclamado: false, puntos: 0, racha, dia7Disponible: true, nuevoSaldo: d.saldoPuntos || 0 };
    }
    const nuevoSaldo = (d.saldoPuntos || 0) + racha.puntos;
    const nuevoTotal = (d.totalAcumulado || 0) + racha.puntos;
    console.log('[dailyLogin] writing:', { saldoPuntos: nuevoSaldo, rachaLoginDias: racha.dias, ultimoLoginDate: racha.ultimoLogin });
    await setDoc(ref, {
      saldoPuntos: nuevoSaldo,
      totalAcumulado: nuevoTotal,
      rachaLoginDias: racha.dias,
      ultimoLoginDate: racha.ultimoLogin,
      graceUsados: racha.graceUsados,
    }, { merge: true });
    const afterSnap = await getDoc(ref);
    console.log('[dailyLogin] after write:', afterSnap.data());
    await addDoc(collection(db, 'puntos_movimientos'), {
      uid: u.uid, tipo: 'login_diario', puntos: racha.puntos,
      descripcion: `Login diario día ${racha.dias}`,
      createdAt: Timestamp.now(),
    });
    return { yaReclamado: false, puntos: racha.puntos, racha, nuevoSaldo };
  },

  claimWheelReward: async () => {
    const u = await requireUser();
    const ref = doc(db, 'usuarios', u.uid);
    const snap = await getDoc(ref);
    const d = snap.data() || {};
    const prize = spinWheel();
    const nuevoSaldo = (d.saldoPuntos || 0) + prize.puntos;
    const nuevoTotal = (d.totalAcumulado || 0) + prize.puntos;
    await setDoc(ref, {
      saldoPuntos: nuevoSaldo,
      totalAcumulado: nuevoTotal,
      rachaLoginDias: 0,
      ultimoLoginDate: new Date().toISOString().split('T')[0],
      graceUsados: 0,
    }, { merge: true });
    await addDoc(collection(db, 'puntos_movimientos'), {
      uid: u.uid, tipo: 'ruleta_dia7', puntos: prize.puntos,
      descripcion: `Ruleta día 7: ${prize.label}`,
      createdAt: Timestamp.now(),
    });
    return { puntos: prize.puntos, label: prize.label, nuevoSaldo };
  },

  getWheelPrizes: () => WHEEL_PRIZES.map(p => ({ puntos: p.puntos, label: p.label })),

  redeem: async (puntos) => {
    const u = await requireUser();
    const ref = doc(db, 'usuarios', u.uid);
    const snap = await getDoc(ref);
    const d = snap.data() || {};
    if ((d.saldoPuntos || 0) < puntos) throw new Error('Saldo insuficiente');
    const nuevoSaldo = (d.saldoPuntos || 0) - puntos;
    const nuevoCanjeado = (d.totalCanjeado || 0) + puntos;
    await setDoc(ref, { saldoPuntos: nuevoSaldo, totalCanjeado: nuevoCanjeado }, { merge: true });
    await addDoc(collection(db, 'puntos_movimientos'), {
      uid: u.uid, tipo: 'canje_descuento', puntos: -puntos,
      descripcion: `Canje de ${puntos} puntos`,
      createdAt: Timestamp.now(),
    });
    return { nuevoSaldo };
  },

  review: async (data) => {
    const u = await requireUser();
    const ref = doc(db, 'usuarios', u.uid);
    const snap = await getDoc(ref);
    const d = snap.data() || {};
    const pts = 20;
    const nuevoSaldo = (d.saldoPuntos || 0) + pts;
    const nuevoTotal = (d.totalAcumulado || 0) + pts;
    await setDoc(ref, { saldoPuntos: nuevoSaldo, totalAcumulado: nuevoTotal }, { merge: true });
    await addDoc(collection(db, 'puntos_movimientos'), {
      uid: u.uid, tipo: 'resena', puntos: pts,
      descripcion: `Reseña reseña`,
      createdAt: Timestamp.now(),
    });
    return { puntos: pts, nuevoSaldo: (d.saldoPuntos || 0) + pts };
  },
};

/* ────────────── RESERVATIONS ────────────── */

function genCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const reservationsApi = {
  create: async (data) => {
    const u = await requireUser();
    const codigo = genCodigo();
    const docRef = await addDoc(collection(db, 'reservas'), {
      restaurantId: data.restauranteId || data.restaurante?.id,
      nombreRestaurante: data.restaurante?.nombre || data.nombreRestaurante,
      uid: u.uid,
      usuarioNombre: u.displayName || u.email,
      usuarioEmail: u.email,
      fecha: data.fecha,
      hora: data.hora,
      comensales: Number(data.comensales),
      comentarios: data.comentarios || '',
      codigo,
      estado: 'pendiente',
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, codigo };
  },

  list: async (params = {}) => {
    const u = await requireUser();
    const constraints = [where('uid', '==', u.uid), orderBy('fecha', 'desc')];
    if (params.estado) constraints.splice(1, 0, where('estado', '==', params.estado));
    const q = query(collection(db, 'reservas'), ...constraints, limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  cancel: async (id) => {
    await updateDoc(doc(db, 'reservas', id), { estado: 'cancelada', updatedAt: Timestamp.now() });
    return { ok: true };
  },

  complete: async (id, precioBase) => {
    await updateDoc(doc(db, 'reservas', id), { estado: 'completada', precioBase, updatedAt: Timestamp.now() });
    return { ok: true };
  },
};

/* ────────────── TICKETS ────────────── */

export const ticketsApi = {
  list: async () => {
    const u = await requireUser();
    const q = query(collection(db, 'tickets'), where('uid', '==', u.uid), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  get: async (id) => {
    const snap = await getDoc(doc(db, 'tickets', id));
    if (!snap.exists()) throw new Error('Ticket no encontrado');
    return { id: snap.id, ...snap.data() };
  },
};

/* ────────────── INVITATIONS ────────────── */

export const invitationsApi = {
  create: async (email) => {
    const u = await requireUser();
    const snap = await getDocs(query(collection(db, 'invitaciones'), where('creadorUid', '==', u.uid)));
    const thisMonth = snap.docs.filter(d => {
      const c = d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(d.data().createdAt);
      const now = new Date();
      return c.getMonth() === now.getMonth() && c.getFullYear() === now.getFullYear();
    });
    if (thisMonth.length >= 5) throw new Error('Límite de 5 invitaciones por mes');
    const codigo = Math.random().toString(36).substring(2, 10).toUpperCase();
    const docRef = await addDoc(collection(db, 'invitaciones'), {
      creadorUid: u.uid, emailInvitado: email, codigo,
      estado: 'pendiente', reservasAmigo: 0,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, codigo, email, estado: 'pendiente' };
  },

  accept: async (codigo) => {
    const u = await requireUser();
    const q = query(collection(db, 'invitaciones'), where('codigo', '==', codigo));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Código no válido');
    const invDoc = snap.docs[0];
    const inv = invDoc.data();
    if (inv.emailInvitado !== u.email) throw new Error('Este código no es para ti');
    if (inv.estado !== 'pendiente') throw new Error('Invitación ya usada');
    await updateDoc(invDoc.ref, { estado: 'aceptada', aceptadaPor: u.uid, aceptadaEn: Timestamp.now() });
    return { ok: true, creadorUid: inv.creadorUid };
  },

  getMy: async () => {
    const u = await requireUser();
    const [enviadasSnap, aceptadasSnap] = await Promise.all([
      getDocs(query(collection(db, 'invitaciones'), where('creadorUid', '==', u.uid), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'invitaciones'), where('aceptadaPor', '==', u.uid))),
    ]);
    return {
      enviadas: enviadasSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      aceptadas: aceptadasSnap.size,
      invitaciones: enviadasSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    };
  },
};

/* ────────────── PROMOTIONS ────────────── */

export const promotionsApi = {
  list: async (params = {}) => {
    const constraints = [where('estado', '==', 'activa'), orderBy('createdAt', 'desc')];
    const q = query(collection(db, 'promociones'), ...constraints, limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getStats: async (id) => {
    const snap = await getDoc(doc(db, 'promociones', id));
    if (!snap.exists()) throw new Error('Promoción no encontrada');
    return { id: snap.id, ...snap.data() };
  },
};

/* ────────────── INTERACTIONS ────────────── */

export const interactionsApi = {
  track: async (restauranteId, tipo) => {
    const u = getUser();
    await addDoc(collection(db, 'interacciones'), {
      uid: u?.uid || 'anon', restauranteId, tipo,
      createdAt: Timestamp.now(),
    });
    return { ok: true };
  },
};

/* ────────────── ADMIN ────────────── */

export const adminApi = {
  getRevenue: async (params = {}) => {
    const snap = await getDocs(query(collection(db, 'tickets'), orderBy('createdAt', 'desc'), limit(500)));
    const tickets = snap.docs.map(d => d.data());
    const total = tickets.reduce((s, t) => s + (t.totalPagado || 0), 0);
    const comisiones = tickets.reduce((s, t) => s + (t.importeComision || 0), 0);
    return { total, comisiones, tickets: tickets.length };
  },
  getFraudFlags: async () => [],
};

/* ────────────── DASHBOARD (restaurante + admin) ────────────── */

export const dashboardApi = {
  getMyRestaurant: async () => {
    const u = await requireUser();
    const userDoc = await getDoc(doc(db, 'usuarios', u.uid));
    const userData = userDoc.data();
    let restaurantId = userData?.restaurantId || null;

    if (!restaurantId) {
      const q = query(collection(db, 'restaurants'), where('uid', '==', u.uid), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error('Restaurante no encontrado');
      restaurantId = snap.docs[0].id;
    }

    const restDoc = await getDoc(doc(db, 'restaurants', restaurantId));
    if (!restDoc.exists()) throw new Error('Restaurante no encontrado');
    const restaurante = { id: restDoc.id, ...restDoc.data() };

    const [reservasSnap, ticketsSnap] = await Promise.all([
      getDocs(query(collection(db, 'reservas'), where('restaurantId', '==', restaurantId), orderBy('fecha', 'desc'), limit(500))),
      getDocs(query(collection(db, 'tickets'), where('restaurantId', '==', restaurantId), orderBy('createdAt', 'desc'), limit(500))),
    ]);
    const reservas = reservasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tickets = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const hoy = new Date().toISOString().split('T')[0];
    const totalReservas = reservas.length;
    const reservasCompletadas = reservas.filter(r => r.estado === 'completada').length;
    const reservasCanceladas = reservas.filter(r => r.estado === 'cancelada').length;
    const reservasNoShow = reservas.filter(r => r.estado === 'no_show').length;
    const reservasPendientes = reservas.filter(r => r.estado === 'confirmada' || r.estado === 'pendiente').length;
    const reservasHoy = reservas.filter(r => r.fecha === hoy && r.estado !== 'cancelada').length;
    const totalFacturacion = tickets.reduce((s, t) => s + (t.totalPagado || 0), 0);
    const totalComisiones = tickets.reduce((s, t) => s + (t.importeComision || 0), 0);

    const proximasReservas = reservas
      .filter(r => r.fecha >= hoy && (r.estado === 'confirmada' || r.estado === 'pendiente'))
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
      .slice(0, 20);

    const ingresosPorMes = {};
    tickets.forEach(t => {
      const fecha = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!ingresosPorMes[mes]) ingresosPorMes[mes] = { facturacion: 0, comisiones: 0, tickets: 0 };
      ingresosPorMes[mes].facturacion += t.totalPagado || 0;
      ingresosPorMes[mes].comisiones += t.importeComision || 0;
      ingresosPorMes[mes].tickets += 1;
    });

    return {
      restaurante,
      stats: { totalReservas, reservasCompletadas, reservasCanceladas, reservasNoShow, reservasPendientes, reservasHoy, totalFacturacion: Math.round(totalFacturacion * 100) / 100, totalComisiones: Math.round(totalComisiones * 100) / 100, ticketPromedio: tickets.length > 0 ? Math.round(totalFacturacion / tickets.length * 100) / 100 : 0 },
      proximasReservas,
      ingresosPorMes,
      ticketsRecientes: tickets.slice(0, 20),
    };
  },

  getRestaurant: async (restaurantId) => {
    const restDoc = await getDoc(doc(db, 'restaurants', restaurantId));
    if (!restDoc.exists()) throw new Error('Restaurante no encontrado');
    const restaurante = { id: restDoc.id, ...restDoc.data() };

    const [reservasSnap, ticketsSnap] = await Promise.all([
      getDocs(query(collection(db, 'reservas'), where('restaurantId', '==', restaurantId), orderBy('fecha', 'desc'), limit(500))),
      getDocs(query(collection(db, 'tickets'), where('restaurantId', '==', restaurantId), orderBy('createdAt', 'desc'), limit(500))),
    ]);
    const reservas = reservasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tickets = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const hoy = new Date().toISOString().split('T')[0];
    const totalReservas = reservas.length;
    const reservasCompletadas = reservas.filter(r => r.estado === 'completada').length;
    const reservasCanceladas = reservas.filter(r => r.estado === 'cancelada').length;
    const reservasNoShow = reservas.filter(r => r.estado === 'no_show').length;
    const reservasPendientes = reservas.filter(r => r.estado === 'confirmada' || r.estado === 'pendiente').length;
    const totalFacturacion = tickets.reduce((s, t) => s + (t.totalPagado || 0), 0);
    const totalComisiones = tickets.reduce((s, t) => s + (t.importeComision || 0), 0);

    const ingresosPorMes = {};
    tickets.forEach(t => {
      const fecha = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!ingresosPorMes[mes]) ingresosPorMes[mes] = { facturacion: 0, comisiones: 0, tickets: 0 };
      ingresosPorMes[mes].facturacion += t.totalPagado || 0;
      ingresosPorMes[mes].comisiones += t.importeComision || 0;
      ingresosPorMes[mes].tickets += 1;
    });

    return {
      restaurante,
      stats: { totalReservas, reservasCompletadas, reservasCanceladas, reservasNoShow, reservasPendientes, totalFacturacion: Math.round(totalFacturacion * 100) / 100, totalComisiones: Math.round(totalComisiones * 100) / 100, ticketPromedio: tickets.length > 0 ? Math.round(totalFacturacion / tickets.length * 100) / 100 : 0 },
      proximasReservas: reservas.filter(r => r.fecha >= hoy && (r.estado === 'confirmada' || r.estado === 'pendiente')).slice(0, 20),
      ingresosPorMes,
      ticketsRecientes: tickets.slice(0, 20),
    };
  },

  getAdmin: async () => {
    const [usersSnap, reservasSnap, ticketsSnap, promosSnap] = await Promise.all([
      getDocs(collection(db, 'usuarios')),
      getDocs(query(collection(db, 'reservas'), orderBy('createdAt', 'desc'), limit(2000))),
      getDocs(query(collection(db, 'tickets'), orderBy('createdAt', 'desc'), limit(2000))),
      getDocs(collection(db, 'promociones')),
    ]);

    const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
    const reservas = reservasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tickets = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const totalUsuarios = usersSnap.size;
    const usuariosActivos = users.filter(u => u.tipo !== 'admin').length;
    const totalReservas = reservas.length;
    const reservasCompletadas = reservas.filter(r => r.estado === 'completada').length;
    const reservasCanceladas = reservas.filter(r => r.estado === 'cancelada').length;
    const reservasNoShow = reservas.filter(r => r.estado === 'no_show').length;
    const totalFacturacion = tickets.reduce((s, t) => s + (t.totalPagado || 0), 0);
    const totalComisiones = tickets.reduce((s, t) => s + (t.importeComision || 0), 0);

    const reservasPorRestaurante = {};
    reservas.forEach(r => {
      const key = r.restaurantId || 'unknown';
      if (!reservasPorRestaurante[key]) reservasPorRestaurante[key] = { nombre: r.nombreRestaurante || key, total: 0, completadas: 0, canceladas: 0, noShow: 0 };
      reservasPorRestaurante[key].total++;
      if (r.estado === 'completada') reservasPorRestaurante[key].completadas++;
      if (r.estado === 'cancelada') reservasPorRestaurante[key].canceladas++;
      if (r.estado === 'no_show') reservasPorRestaurante[key].noShow++;
    });

    const facturacionPorMes = {};
    tickets.forEach(t => {
      const fecha = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!facturacionPorMes[mes]) facturacionPorMes[mes] = { facturacion: 0, comisiones: 0, tickets: 0, reservas: 0 };
      facturacionPorMes[mes].facturacion += t.totalPagado || 0;
      facturacionPorMes[mes].comisiones += t.importeComision || 0;
      facturacionPorMes[mes].tickets += 1;
    });
    reservas.forEach(r => {
      const fecha = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (facturacionPorMes[mes]) facturacionPorMes[mes].reservas++;
    });

    return {
      stats: {
        totalUsuarios, usuariosActivos, totalReservas, reservasCompletadas, reservasCanceladas, reservasNoShow,
        totalFacturacion: Math.round(totalFacturacion * 100) / 100,
        totalComisiones: Math.round(totalComisiones * 100) / 100,
        totalPromociones: promosSnap.size,
        promosActivas: promosSnap.docs.filter(d => d.data().estado === 'activa').length,
      },
      reservasPorRestaurante,
      facturacionPorMes,
      ticketsRecientes: tickets.slice(0, 30),
    };
  },

  getUsers: async () => {
    const snap = await getDocs(collection(db, 'usuarios'));
    return snap.docs.map(d => ({
      uid: d.id,
      nombre: d.data().nombre,
      email: d.data().email,
      tipo: d.data().tipo,
      saldoPuntos: d.data().saldoPuntos || 0,
      createdAt: d.data().createdAt,
    }));
  },

  updateRestaurant: async (restaurantId, data) => {
    const allowed = ['nombre', 'direccion', 'telefono', 'email', 'horarios', 'activo', 'ciudad', 'zona', 'precio', 'cocina', 'descripcion', 'comisionPct'];
    const update = {};
    allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k]; });
    update.updatedAt = Timestamp.now();
    await updateDoc(doc(db, 'restaurants', restaurantId), update);
    return { updated: true };
  },

  updateReservationStatus: async (reservaId, status) => {
    await updateDoc(doc(db, 'reservas', reservaId), { estado: status, updatedAt: Timestamp.now() });
    return { updated: true, status };
  },

  confirmAttendance: async (reservaId, data) => {
    await updateDoc(doc(db, 'reservas', reservaId), { estado: 'completada', updatedAt: Timestamp.now() });
    return { updated: true, status: 'completada' };
  },

  markNoShow: async (reservaId) => {
    await updateDoc(doc(db, 'reservas', reservaId), { estado: 'no_show', updatedAt: Timestamp.now() });
    return { updated: true, status: 'no_show' };
  },

  addPointsManual: async (uid, cantidad, motivo) => {
    const ref = doc(db, 'usuarios', uid);
    const snap = await getDoc(ref);
    const d = snap.data() || {};
    const nuevoSaldo = (d.saldoPuntos || 0) + cantidad;
    const nuevoTotal = (d.totalAcumulado || 0) + Math.max(cantidad, 0);
    await setDoc(ref, { saldoPuntos: nuevoSaldo, totalAcumulado: nuevoTotal }, { merge: true });
    await addDoc(collection(db, 'puntos_movimientos'), {
      uid, tipo: 'ajuste_admin', puntos: cantidad,
      descripcion: motivo,
      createdAt: Timestamp.now(),
    });
    return { updated: true };
  },
};
