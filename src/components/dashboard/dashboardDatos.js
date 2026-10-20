import { fechaDeTicket } from "../fiscal/fiscalReal.js";

/** Una reserva puede aparecer tanto en las de hoy como en las próximas. */
export function unirReservas(...listas) {
  const porId = new Map();
  for (const reserva of listas.flat()) porId.set(reserva.id ?? reserva, reserva);
  return [...porId.values()];
}

/** El periodo solo incluye tickets con fecha conocida. */
export function filtrarTicketsPeriodo(lista, periodo, ahora = new Date()) {
  const hoy = fechaDeTicket({ createdAt: ahora });
  const anio = hoy.slice(0, 4);
  const mes = hoy.slice(0, 7);
  const limite = new Date(`${hoy}T12:00:00Z`);
  limite.setUTCDate(limite.getUTCDate() - 90);
  const desde = limite.toISOString().slice(0, 10);
  return lista.filter((ticket) => {
    const fecha = fechaDeTicket(ticket);
    if (!fecha) return false;
    if (periodo === '90d') return fecha >= desde;
    return periodo === 'anio' ? fecha.startsWith(`${anio}-`) : fecha.startsWith(mes);
  });
}

/** Serializa la asistencia persistida; tickets antiguos sin flag mantienen sí. */
export function csvLiquidacion(lista, comisionPct) {
  const rows = lista.map(t=> ({ fecha: fechaDeTicket(t), codigo: t.codigoReserva || t.id.slice(0,6), total: t.totalPagado||0, comision: t.importeComision!=null ? t.importeComision : Math.round((t.totalPagado||0)*(comisionPct/100)*100)/100, neto: t.netoRestaurante!=null ? t.netoRestaurante : Math.round(((t.totalPagado||0) - (t.importeComision!=null ? t.importeComision : (t.totalPagado||0)*(comisionPct/100)))*100)/100, cliente: t.clienteNombre||t.restauranteNombre||'', asistio: t.asistio !== false }));
  const header = ['Fecha','Codigo','Cliente','Total',`Comision ${comisionPct}%`,'Neto','Asistio'];
  return [header.join(';'), ...rows.map(r=> [r.fecha,r.codigo,`"${r.cliente}"`,r.total.toFixed(2),r.comision.toFixed(2),r.neto.toFixed(2), r.asistio ? 'si' : 'no'].join(';'))].join('\n');
}

/** No generar un documento con una vista previa de tickets truncada. */
export function ticketsCompletos(datos) {
  if (!Array.isArray(datos?.tickets)) throw new Error('TICKETS_INCOMPLETOS');
  return datos.tickets;
}
