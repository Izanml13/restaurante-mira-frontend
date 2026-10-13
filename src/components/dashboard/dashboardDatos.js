/** Una reserva puede aparecer tanto en las de hoy como en las próximas. */
export function unirReservas(...listas) {
  const porId = new Map();
  for (const reserva of listas.flat()) porId.set(reserva.id ?? reserva, reserva);
  return [...porId.values()];
}
