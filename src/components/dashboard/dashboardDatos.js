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
