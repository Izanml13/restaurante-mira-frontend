/**
 * Banner de cookies: aceptar todas, rechazar (solo necesarias) o configurar por categorías.
 * Guarda en localStorage (invitado) y Firestore (logueado) con timestamp.
 */
import { useState, useEffect } from 'react';
import { COOKIE_CATEGORIAS, COOKIE_DEFAULT, leerCookies, guardarCookies, tieneConsentimiento } from '../services/cookieService.js';

export default function CookieBanner({ usuario }) {
  const [visible, setVisible] = useState(false);
  const [configurando, setConfigurando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [prefs, setPrefs] = useState({ ...COOKIE_DEFAULT });

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    leerCookies(usuario?.uid)
      .then((c) => {
        if (!vivo) return;
        if (tieneConsentimiento(c)) {
          setVisible(false);
        } else {
          setVisible(true);
          setPrefs({ ...COOKIE_DEFAULT, ...c });
        }
        setCargando(false);
      })
      .catch(() => { if (vivo) { setVisible(true); setCargando(false); } });
    return () => { vivo = false; };
  }, [usuario]);

  async function aceptarTodas() {
    const datos = { ...COOKIE_DEFAULT, necesarias: true, preferencias: true, analiticas: true, marketing: true };
    await guardarCookies(datos, usuario?.uid);
    setVisible(false);
  }

  async function rechazar() {
    await guardarCookies({ ...COOKIE_DEFAULT }, usuario?.uid);
    setVisible(false);
  }

  async function guardarConfig() {
    await guardarCookies({ ...prefs, necesarias: true }, usuario?.uid);
    setVisible(false);
    setConfigurando(false);
  }

  function toggle(key) {
    if (key === 'necesarias') return;
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  if (cargando || !visible) return null;

  return (
    <div className="cookie-fondo" role="dialog" aria-label="Aviso de cookies" aria-modal="false">
      <div className="cookie-banner">
        {!configurando ? (
          <>
            <div className="cookie-texto">
              <h2 className="cookie-titulo">🍪 Cookies</h2>
              <p>
                Usamos cookies para que la web funcione correctamente, recordar tus ajustes
                y mejorar tu experiencia. Puedes aceptar todas, rechazar las opcionales o
                configurarlas.
              </p>
            </div>
            <div className="cookie-acciones">
              <button type="button" className="btn-cta btn-peq" onClick={aceptarTodas}>
                Aceptar todas
              </button>
              <button type="button" className="btn-secundario btn-peq" onClick={rechazar}>
                Solo necesarias
              </button>
              <button type="button" className="btn-texto" onClick={() => setConfigurando(true)}>
                Configurar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cookie-texto">
              <h2 className="cookie-titulo">Configurar cookies</h2>
              {COOKIE_CATEGORIAS.map((cat) => (
                <label key={cat.key} className="campo-check cookie-cat">
                  <input
                    type="checkbox"
                    checked={Boolean(prefs[cat.key])}
                    onChange={() => toggle(cat.key)}
                    disabled={cat.requerida}
                  />
                  <span>
                    <strong>{cat.label}</strong>
                    {cat.requerida && <span className="cookie-oblig"> (obligatoria)</span>}
                    <br />
                    <span className="cookie-desc">{cat.desc}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="cookie-acciones">
              <button type="button" className="btn-cta btn-peq" onClick={guardarConfig}>
                Guardar preferencias
              </button>
              <button type="button" className="btn-secundario btn-peq" onClick={() => setConfigurando(false)}>
                ← Volver
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
