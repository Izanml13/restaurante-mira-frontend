/**
 * Comprime una imagen en el navegador antes de subirla (fotos de la JAM).
 * Recorta al centro con la proporción pedida, la reduce y baja la calidad
 * hasta que el data URL cabe en maxChars, para no inflar Firestore.
 */

/** Recorte centrado de (ancho × alto) con la proporción ancho/alto `ratio`. */
export function recorteCentrado(ancho, alto, ratio) {
  if (ancho / alto > ratio) {
    const sw = Math.round(alto * ratio);
    return { sx: Math.round((ancho - sw) / 2), sy: 0, sw, sh: alto };
  }
  const sh = Math.round(ancho / ratio);
  return { sx: 0, sy: Math.round((alto - sh) / 2), sw: ancho, sh };
}

function cargar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}

/**
 * @param {File} file
 * @param {{ ancho: number, alto: number, maxChars: number }} destino tamaño final y límite del data URL
 * @returns {Promise<string>} data URL (webp, o jpeg si el navegador no sabe webp)
 */
export async function comprimirImagen(file, { ancho, alto, maxChars }) {
  if (!file?.type?.startsWith('image/')) throw new Error('El archivo no es una imagen');
  const img = await cargar(file);
  const { sx, sy, sw, sh } = recorteCentrado(img.naturalWidth, img.naturalHeight, ancho / alto);
  const canvas = document.createElement('canvas');
  for (let escala = 1; escala >= 0.4; escala -= 0.2) {
    canvas.width = Math.round(Math.min(ancho, sw) * escala);
    canvas.height = Math.round(canvas.width * (alto / ancho));
    canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    for (const calidad of [0.82, 0.7, 0.58, 0.46]) {
      let dataUrl = canvas.toDataURL('image/webp', calidad);
      if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/jpeg', calidad);
      if (dataUrl.length <= maxChars) return dataUrl;
    }
  }
  throw new Error('La imagen es demasiado pesada, prueba con otra');
}
