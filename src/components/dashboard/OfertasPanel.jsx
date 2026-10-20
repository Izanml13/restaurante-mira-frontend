import { useState, useEffect, useCallback } from "react";
import { ofertasApi } from "../../services/ofertasApi.js";
import {
  DISTANCIAS, claveNivel, ofertaVacia, ofertaAFormulario, nivelesMejoran,
  validarOferta, paraGuardar, estadoOferta, erroresDeApi, claveErrorApi,
} from "../../models/ofertasModel.js";
import { useT } from "../../i18n/index.jsx";
import es from "../../i18n/es.js";
import ca from "../../i18n/ca.js";
import en from "../../i18n/en.js";

const TRADS = { es, ca, en };

const ESTADO_BADGE = { activa: "confirmada", fueraVigencia: "pendiente", inactiva: "cancelada" };
const ESTADO_CLAVE = { activa: "estadoActiva", fueraVigencia: "estadoFuera", inactiva: "estadoInactiva" };

/**
 * Editor de ofertas por distancia del restaurante (G04, fase 1).
 * Lista + crear/editar con un formulario por nivel (1 km, 500 m, 100 m, llegada)
 * y aviso si un nivel no mejora al anterior.
 */
const REFRESCO_MS = 15000;

export default function OfertasPanel({ restauranteId }) {
  const t = useT(TRADS);
  const [ofertas, setOfertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCargar, setErrorCargar] = useState(false);
  const [modo, setModo] = useState("lista"); // lista | crear | editar
  const [ofertaId, setOfertaId] = useState(null);
  const [form, setForm] = useState(ofertaVacia);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(""); // creada | editada | borrada
  const [borrarId, setBorrarId] = useState(null);

  const recargar = useCallback(async (silencioso = false) => {
    if (!restauranteId) { setOfertas([]); setCargando(false); return; }
    if (!silencioso) setCargando(true);
    setErrorCargar(false);
    try {
      setOfertas(await ofertasApi.listarMias(restauranteId));
    } catch {
      setErrorCargar(true);
    } finally {
      setCargando(false);
    }
  }, [restauranteId]);

  useEffect(() => { recargar(); }, [recargar]);

  // Se vuelve a pedir cada poco (sin parpadeo) para ver los cambios sin recargar.
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) recargar(true); }, REFRESCO_MS);
    return () => clearInterval(id);
  }, [recargar]);

  useEffect(() => {
    if (!aviso) return undefined;
    const id = setTimeout(() => setAviso(""), 4000);
    return () => clearTimeout(id);
  }, [aviso]);

  function cambiar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores({});
    setErrorGeneral("");
  }

  function cambiarNivel(i, campo, valor) {
    setForm((prev) => ({
      ...prev,
      niveles: prev.niveles.map((n, k) => (k === i
        ? { ...n, [campo]: campo === "descuentoPct" ? (valor === "" ? "" : Number(valor)) : valor }
        : n)),
    }));
    setErrores({});
    setErrorGeneral("");
  }

  function abrirCrear() {
    setForm(ofertaVacia());
    setOfertaId(null);
    setErrores({});
    setErrorGeneral("");
    setModo("crear");
  }

  function abrirEditar(o) {
    setForm(ofertaAFormulario(o));
    setOfertaId(o.id);
    setErrores({});
    setErrorGeneral("");
    setModo("editar");
  }

  async function guardar() {
    const e = validarOferta(form);
    if (e) { setErrores(e); return; }
    setGuardando(true);
    setErrorGeneral("");
    try {
      if (modo === "editar") await ofertasApi.editar(ofertaId, paraGuardar(form));
      else await ofertasApi.crear(paraGuardar(form, restauranteId));
      setAviso(modo === "editar" ? "editada" : "creada");
      setModo("lista");
      await recargar();
    } catch (err) {
      const detalles = erroresDeApi(err);
      if (detalles) setErrores(detalles);
      setErrorGeneral(t(`ofertas.${claveErrorApi(err)}`));
    } finally {
      setGuardando(false);
    }
  }

  async function borrar() {
    const id = borrarId;
    setBorrarId(null);
    if (!id) return;
    try {
      await ofertasApi.borrar(id);
      setAviso("borrada");
      await recargar();
    } catch (err) {
      setErrorGeneral(t(`ofertas.${claveErrorApi(err)}`));
    }
  }

  const numeros = form.niveles.map((n) => ({ ...n, descuentoPct: Number(n.descuentoPct) || 0 }));
  const mejoran = nivelesMejoran(numeros);
  const vigencia = (o) => (o.desde || o.hasta ? `${o.desde || "…"} → ${o.hasta || "…"}` : t("ofertas.vigenciaSin"));

  return (
    <div className="op-panel ofertas-panel" data-test="ofertas-panel">
      <div className="ofertas-head">
        <div>
          <div className="op-panel-title">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--op-primary)" }}>local_offer</span>
            {t("ofertas.titulo")}
          </div>
          <p className="ofertas-intro">{t("ofertas.intro")}</p>
        </div>
        {modo === "lista" && (
          <button type="button" className="op-btn-primary" onClick={abrirCrear} data-test="ofertas-nueva">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> {t("ofertas.nueva")}
          </button>
        )}
      </div>

      {aviso && (
        <p className="ofertas-ok" role="status" data-test="ofertas-aviso">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
          {t(`ofertas.${aviso}`)}
        </p>
      )}
      {errorGeneral && !cargando && modo === "lista" && (
        <p className="ofertas-error" role="alert">{errorGeneral}</p>
      )}

      {modo !== "lista" && (
        <div className="ofertas-form" data-test="ofertas-form">
          <label className="op-field">
            <span>{t("ofertas.tituloCampo")}</span>
            <input className="op-input" type="text" maxLength={80} value={form.titulo}
              onChange={(e) => cambiar("titulo", e.target.value)} data-test="ofertas-titulo" />
            {errores.titulo && <span className="ofertas-error">{t(`ofertas.${errores.titulo[0]}`)}</span>}
          </label>
          <div className="ofertas-form-fila">
            <label className="op-field">
              <span>{t("ofertas.activa")}</span>
              <select className="op-select" value={form.activa ? "si" : "no"} onChange={(e) => cambiar("activa", e.target.value === "si")}>
                <option value="si">{t("ofertas.si")}</option>
                <option value="no">{t("ofertas.no")}</option>
              </select>
            </label>
            <label className="op-field">
              <span>{t("ofertas.desde")}</span>
              <input className="op-input" type="date" value={form.desde || ""} onChange={(e) => cambiar("desde", e.target.value || null)} />
            </label>
            <label className="op-field">
              <span>{t("ofertas.hasta")}</span>
              <input className="op-input" type="date" value={form.hasta || ""} onChange={(e) => cambiar("hasta", e.target.value || null)} />
            </label>
            {(errores.desde || errores.hasta) && (
              <span className="ofertas-error">{t(`ofertas.${(errores.hasta || errores.desde)[0]}`)}</span>
            )}
          </div>

          <div className="ofertas-niveles">
            {DISTANCIAS.map((distancia, i) => (
              <div key={distancia} className="ofertas-nivel">
                <span className="ofertas-nivel-label">{t(`ofertas.${claveNivel(distancia)}`)}</span>
                <input className="op-input" type="text" maxLength={140} placeholder={t("ofertas.nivelTexto")}
                  value={form.niveles[i].texto} onChange={(e) => cambiarNivel(i, "texto", e.target.value)}
                  data-test={`ofertas-nivel-texto-${distancia}`} />
                <input className="op-input" type="number" min={0} max={100} step={1} placeholder={t("ofertas.nivelDescuento")}
                  value={form.niveles[i].descuentoPct} onChange={(e) => cambiarNivel(i, "descuentoPct", e.target.value)}
                  data-test={`ofertas-nivel-pct-${distancia}`} />
              </div>
            ))}
          </div>
          {errores.niveles && <p className="ofertas-error">{t(`ofertas.${errores.niveles[0]}`)}</p>}
          {!mejoran && <p className="ofertas-aviso-mejora" data-test="ofertas-aviso-mejora">{t("ofertas.avisoMejora")}</p>}

          {errorGeneral && (
            <p className="ofertas-error" role="alert" data-test="ofertas-error-form">{errorGeneral}</p>
          )}

          <div className="ofertas-acciones">
            <button type="button" className="op-btn-primary" onClick={guardar} disabled={guardando} data-test="ofertas-guardar">
              {guardando ? t("ofertas.guardando") : t("ofertas.guardar")}
            </button>
            <button type="button" className="op-btn-ghost" onClick={() => setModo("lista")} disabled={guardando}>
              {t("ofertas.cancelar")}
            </button>
          </div>
        </div>
      )}

      {modo === "lista" && cargando && <p className="ofertas-vacio">{t("otros.cargando")}</p>}
      {modo === "lista" && errorCargar && (
        <div className="ofertas-vacio">
          <p className="ofertas-error" role="alert">{t("ofertas.errorCargar")}</p>
          <button type="button" className="op-btn-ghost" onClick={() => recargar()}>{t("ofertas.reintentar")}</button>
        </div>
      )}
      {modo === "lista" && !cargando && !errorCargar && ofertas.length === 0 && (
        <p className="ofertas-vacio" data-test="ofertas-vacio">{t("ofertas.sinOfertas")}</p>
      )}

      {modo === "lista" && !errorCargar && ofertas.length > 0 && (
        <div className="ofertas-lista">
          {ofertas.map((o) => {
            const estado = estadoOferta(o);
            return (
              <div key={o.id} className="ofertas-fila" data-test="ofertas-fila">
                <div className="ofertas-fila-info">
                  <div className="ofertas-fila-titulo">
                    {o.titulo}
                    <span className={`op-status ${ESTADO_BADGE[estado]}`}>
                      <span className="op-status-dot"></span>{t(`ofertas.${ESTADO_CLAVE[estado]}`)}
                    </span>
                  </div>
                  <span className="ofertas-fila-meta">{vigencia(o)}</span>
                  <div className="ofertas-chips">
                    {(o.niveles || []).map((n) => (
                      <span key={n.distancia} className="ofertas-chip">
                        {t(`ofertas.${claveNivel(n.distancia)}`)} · −{n.descuentoPct}%
                      </span>
                    ))}
                  </div>
                </div>
                <div className="ofertas-fila-acciones">
                  <button type="button" className="op-btn-ghost" onClick={() => abrirEditar(o)} data-test={`ofertas-editar-${o.id}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span> {t("ofertas.editar")}
                  </button>
                  {borrarId === o.id ? (
                    <span className="ofertas-borrar-confirm">
                      {t("ofertas.confirmarBorrar")}
                      <button type="button" className="op-btn-ghost" onClick={borrar} data-test="ofertas-borrar-si">{t("ofertas.si")}</button>
                      <button type="button" className="op-btn-ghost" onClick={() => setBorrarId(null)}>{t("ofertas.no")}</button>
                    </span>
                  ) : (
                    <button type="button" className="op-btn-ghost" onClick={() => setBorrarId(o.id)} data-test={`ofertas-borrar-${o.id}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--op-error)" }}>delete</span> {t("ofertas.borrar")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
