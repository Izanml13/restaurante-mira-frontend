/**
 * Model — pantalla de llegada con QR (G09). Igual en la web y en la app.
 * - trazadoQR: texto del QR → { size, d } (un único path SVG, sin canvas).
 * - estadoVisible: 'pendiente' | 'confirmada' | 'caducada' (una pendiente
 *   pasada de hora se muestra ya como caducada, sin esperar a la API).
 * - segundosRestantes / formatoCuenta: cuenta atrás hasta caducaEn.
 */
import QRCode from 'qrcode';

export const SONDEO_MS = 4000;

export function trazadoQR(texto) {
  const { modules } = QRCode.create(String(texto), { errorCorrectionLevel: 'M' });
  const n = modules.size;
  let d = '';
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      if (modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return { size: n, d };
}

export function segundosRestantes(caducaEn, ahora = Date.now()) {
  const fin = Date.parse(caducaEn);
  if (!Number.isFinite(fin)) return 0;
  return Math.max(0, Math.round((fin - ahora) / 1000));
}

export function formatoCuenta(segundos) {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function estadoVisible(visita, ahora = Date.now()) {
  if (!visita) return null;
  if (visita.estado === 'confirmada' || visita.estado === 'caducada') return visita.estado;
  return segundosRestantes(visita.caducaEn, ahora) > 0 ? 'pendiente' : 'caducada';
}
