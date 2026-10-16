/** Compartir es opcional: un APK sin el módulo no debe romper la pantalla. */
export async function compartirArchivo(modulo, uri, opciones) {
  try {
    modulo = typeof modulo === 'function' ? await modulo() : modulo;
    if (!(await modulo?.isAvailableAsync?.()) || typeof modulo?.shareAsync !== 'function') return false;
    await modulo.shareAsync(uri, opciones);
    return true;
  } catch { return false; }
}
