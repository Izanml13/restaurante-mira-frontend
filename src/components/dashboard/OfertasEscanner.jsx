import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { useT } from "../../i18n/index.jsx";
import { ESTADOS, normalizarCodigo, claveMensajeEstado, estadoDesdeError, agregarLlegada } from "../../models/escanerModel.js";
import es from "../../i18n/es.js";
import ca from "../../i18n/ca.js";
import en from "../../i18n/en.js";

const TRADS = { es, ca, en };

/**
 * Escáner de QR de llegada (G10, fase 3). Componente independiente de la
 * sección «Ofertas» del dashboard; no se monta solo.
 *
 * Props:
 *  - onValidar(codigo) → Promise<{ estado, oferta?, visitaId? }> (obligatoria):
 *      quien lo monta decide la fuente — API real (POST .../visitas/validar)
 *      o el mock local (`resultadoMock` de src/models/escanerModel.js).
 *      Si rechaza con err.status, el componente traduce el estado con
 *      `estadoDesdeError` (403 otro restaurante, 409 ya usado, 410 caducado...).
 *  - onValidada(visita) → callback opcional tras validar; `visita` es
 *      { visitaId, oferta, hora } para que quien monta actualice su lista.
 *  - onEstado(estado) → callback opcional del estado visible (idle, escaneando,
 *      validando, ok, error...), por si el panel exterior quiere reaccionar.
 */
export default function OfertasEscanner({ onValidar, onValidada, onEstado }) {
  const t = useT(TRADS);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const validoRef = useRef(false);

  const [camara, setCamara] = useState("inactiva"); // inactiva | activa | sin_permiso | no_disponible
  const [estado, setEstado] = useState("idle");     // idle | escaneando | validando | resultado
  const [resultado, setResultado] = useState(null); // { estado: ESTADOS.*, oferta?, error? }
  const [manual, setManual] = useState("");
  const [llegadas, setLlegadas] = useState([]);

  const notificar = useCallback((e) => { setEstado(e); onEstado?.(e); }, [onEstado]);

  const pararCamara = useCallback(() => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    loopRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => { pararCamara(); }, [pararCamara]);

  const validar = useCallback(async (codigo) => {
    const limpio = normalizarCodigo(codigo);
    if (!limpio) {
      setResultado({ estado: ESTADOS.INVALIDO });
      notificar("resultado");
      return;
    }
    notificar("validando");
    try {
      const r = await onValidar(limpio);
      const visita = { visitaId: r?.visitaId || limpio, oferta: r?.oferta, hora: new Date().toISOString() };
      setLlegadas((prev) => agregarLlegada(prev, visita));
      setResultado({ estado: ESTADOS.OK, oferta: r?.oferta });
      onValidada?.(visita);
    } catch (e) {
      setResultado({ estado: estadoDesdeError(e) });
    } finally {
      notificar("resultado");
    }
  }, [onValidar, onValidada, notificar]);

  const bucle = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      loopRef.current = requestAnimationFrame(bucle);
      return;
    }
    const w = Math.min(video.videoWidth, 480);
    const h = Math.round((video.videoHeight / video.videoWidth) * w) || 480;
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d", { willReadFrequently: true }).drawImage(video, 0, 0, w, h);
    const img = canvas.getContext("2d").getImageData(0, 0, w, h);
    const qr = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
    if (qr?.data && !validoRef.current) {
      validoRef.current = true; // evita varias validaciones con el mismo frame
      pararCamara();
      setCamara("inactiva");
      validar(qr.data);
      return;
    }
    loopRef.current = requestAnimationFrame(bucle);
  }, [pararCamara, validar]);

  const abrirCamara = useCallback(async () => {
    setResultado(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamara("no_disponible");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      validoRef.current = false;
      setCamara("activa");
      notificar("escaneando");
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      loopRef.current = requestAnimationFrame(bucle);
    } catch {
      setCamara("sin_permiso");
    }
  }, [bucle, notificar]);

  const cerrarCamara = useCallback(() => {
    pararCamara();
    setCamara("inactiva");
    notificar("idle");
  }, [pararCamara, notificar]);

  function enviarManual(e) {
    e.preventDefault();
    validar(manual);
  }

  function reiniciar() {
    setResultado(null);
    setManual("");
    notificar("idle");
  }

  const iconoEstado = {
    [ESTADOS.OK]: "check_circle",
    [ESTADOS.CADUCADO]: "schedule",
    [ESTADOS.YA_USADO]: "done_all",
    [ESTADOS.OTRO_RESTAURANTE]: "storefront",
    [ESTADOS.INVALIDO]: "error",
    [ESTADOS.ERROR_RED]: "wifi_off",
  };

  return (
    <div className="op-panel">
      <div className="op-panel-head">
        <h3 className="op-panel-title">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>qr_code_scanner</span>
          {t("escaner.titulo")}
        </h3>
        <p style={{ fontSize: "0.75rem", color: "var(--op-on-variant)" }}>{t("escaner.subtitulo")}</p>
      </div>

      {resultado ? (
        <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{
            fontSize: 48, color: resultado.estado === ESTADOS.OK ? "var(--op-primary)" : "var(--op-error, #d9534f)",
          }}>{iconoEstado[resultado.estado]}</span>
          <p style={{ fontWeight: 700, margin: "0.4rem 0" }}>{t(claveMensajeEstado(resultado.estado))}</p>
          {resultado.estado === ESTADOS.OK && resultado.oferta && (
            <div style={{
              background: "var(--op-surface-container)", borderRadius: "0.6rem", padding: "0.75rem",
              margin: "0.5rem auto", maxWidth: 360,
            }}>
              <strong>{resultado.oferta.titulo}</strong>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.82rem" }}>
                {resultado.oferta.nivel?.texto} · {t("escaner.descuento", { pct: resultado.oferta.nivel?.descuentoPct })}
              </p>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            {camara === "activa"
              ? <button type="button" className="op-btn-ghost" onClick={cerrarCamara}>{t("escaner.detenerCamara")}</button>
              : <button type="button" className="op-btn-primary" onClick={abrirCamara}>{t("escaner.abrirCamara")}</button>}
            <button type="button" className="op-btn-ghost" onClick={reiniciar}>{t("escaner.reintentar")}</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
            <video ref={videoRef} playsInline muted style={{
              display: camara === "activa" ? "block" : "none",
              width: "100%", maxWidth: 360, borderRadius: "0.6rem", background: "#000", margin: "0 auto",
            }} />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {camara === "activa" ? (
              <button type="button" className="op-btn-ghost" style={{ marginTop: "0.5rem" }} onClick={cerrarCamara}>
                {t("escaner.detenerCamara")}
              </button>
            ) : (
              <button type="button" className="op-btn-primary" onClick={abrirCamara}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle" }}>photo_camera</span>{" "}
                {t("escaner.abrirCamara")}
              </button>
            )}
            {camara === "sin_permiso" && <p className="op-empty">{t("escaner.permisoDenegado")}</p>}
            {camara === "no_disponible" && <p className="op-empty">{t("escaner.camaraNoDisponible")}</p>}
            {estado === "escaneando" && <p className="op-empty">{t("escaner.apuntando")}</p>}
          </div>

          {/* Fallback manual: siempre disponible, obligatorio si no hay cámara */}
          <form onSubmit={enviarManual} style={{ marginTop: "0.75rem" }}>
            <label className="op-field">
              <span>{t("escaner.manualTitulo")}</span>
              <input className="op-input" value={manual} onChange={(e) => setManual(e.target.value)}
                placeholder={t("escaner.manualPlaceholder")} autoComplete="off" />
            </label>
            <button type="submit" className="op-btn-ghost" disabled={estado === "validando" || !manual.trim()}>
              {estado === "validando" ? t("escaner.validando") : t("escaner.manualBoton")}
            </button>
          </form>
        </>
      )}

      <h4 className="op-panel-title" style={{ marginTop: "1rem", fontSize: "0.8rem" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>how_to_reg</span>
        {t("escaner.llegadasTitulo")}
      </h4>
      <ul style={{ listStyle: "none", padding: 0, margin: "0.4rem 0 0" }}>
        {llegadas.map((v) => (
          <li key={v.visitaId} style={{
            display: "flex", justifyContent: "space-between", gap: "0.5rem",
            padding: "0.5rem 0", borderBottom: "1px solid var(--op-border)", fontSize: "0.8rem",
          }}>
            <span>{v.oferta?.titulo || t("escaner.ofertaGenerico")}</span>
            <span style={{ color: "var(--op-on-variant)", whiteSpace: "nowrap" }}>
              {v.oferta?.nivel ? t("escaner.descuento", { pct: v.oferta.nivel.descuentoPct }) + " · " : ""}
              {new Date(v.hora).toLocaleTimeString(t("modelos.locale"), { hour: "2-digit", minute: "2-digit" })}
            </span>
          </li>
        ))}
        {llegadas.length === 0 && <li className="op-empty">{t("escaner.sinLlegadas")}</li>}
      </ul>
    </div>
  );
}
