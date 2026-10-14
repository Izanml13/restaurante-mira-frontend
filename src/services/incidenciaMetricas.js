/** Fechas de API: ISO, Date o Timestamp de Firestore serializado. */
export function fechaIncidencia(valor) {
  if (valor == null || valor === '') return null;
  const seconds = valor.seconds ?? valor._seconds;
  const ms = typeof valor.toDate === 'function' ? valor.toDate().getTime()
    : seconds != null ? Number(seconds) * 1000 : new Date(valor).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function filtrarResueltas(lista, { texto = '', desde = '', hasta = '' } = {}) {
  const buscar = texto.trim().toLocaleLowerCase();
  return lista.filter((r) => {
    const ms = fechaIncidencia(r.resueltaEn);
    const dia = ms == null ? '' : new Date(ms).toISOString().slice(0, 10);
    return (!desde || dia >= desde) && (!hasta || (dia && dia <= hasta)) &&
      (!buscar || [r.motivo, r.mensaje, r.nombre, r.email, r.solucion, r.encargado, r.resueltoPor, r.resueltoPorNombre]
        .some((v) => String(v || '').toLocaleLowerCase().includes(buscar)));
  });
}

export function calcularMetricas(lista) {
  const personas = new Map();
  const dias = new Map();
  for (const r of lista) {
    // Los registros antiguos sin autor no se atribuyen al encargado.
    const uid = r.resueltoPor || 'sin-autor';
    if (!personas.has(uid)) personas.set(uid, { uid, persona: r.resueltoPorNombre || r.resueltoPor || 'Sin registrar', resueltas: 0, horas: 0, muestras: 0 });
    const p = personas.get(uid);
    p.resueltas++;
    const inicio = fechaIncidencia(r.creado);
    const fin = fechaIncidencia(r.resueltaEn);
    if (inicio == null || fin == null || fin < inicio) continue;
    const horas = (fin - inicio) / 3600000;
    p.horas += horas; p.muestras++;
    const dia = new Date(fin).toISOString().slice(0, 10);
    const d = dias.get(dia) || { dia, horas: 0, muestras: 0 };
    d.horas += horas; d.muestras++; dias.set(dia, d);
  }
  return {
    personas: [...personas.values()].map(({ horas, ...p }) => ({ ...p, horasMedias: p.muestras ? horas / p.muestras : null })),
    evolucion: [...dias.values()].sort((a, b) => a.dia.localeCompare(b.dia))
      .map(({ horas, ...d }) => ({ ...d, horasMedias: horas / d.muestras })),
  };
}
