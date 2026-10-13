/** Campos obligatorios de la resolución, compartidos por los paneles admin. */
export function validarResolucion(datos) {
  const resolucion = {};
  for (const [campo, max] of [['propuestaResolucion', 4000], ['solucion', 4000], ['encargado', 200]]) {
    const valor = String(datos?.[campo] || '').trim();
    if (!valor || valor.length > max) throw new Error('Completa propuesta, solución y encargado dentro del límite indicado.');
    resolucion[campo] = valor;
  }
  return resolucion;
}
