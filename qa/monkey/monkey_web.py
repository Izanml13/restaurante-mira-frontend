"""Monkey test: pulsa, escribe y navega al azar buscando que la app se rompa.

No valida funcionalidad: busca crashes, pantallas en blanco, errores JS no
capturados y respuestas 500. Cada acción se registra para poder reproducir.

Uso directo:
    python -m monkey.monkey_web --acciones 200 --seed 7 --visible
    python -m monkey.monkey_web --acciones 50 --json salida.json
    python -m monkey.monkey_web --acciones 80 --seed 3 --movil
"""
from __future__ import annotations

import argparse
import contextlib
import json
import pathlib
import random
import sys
import time

from selenium.webdriver.common.by import By

RAIZ_QA = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ_QA))

import helpers as h  # noqa: E402
import servers  # noqa: E402

# Rutas seguras para un visitante sin sesión (las protegidas redirigen solas).
RUTAS = [
    "#/", "#/descubrir", "#/mapa", "#/contacto", "#/login", "#/registro",
    "#/app", "#/privacidad", "#/favoritos", "#/puntos", "#/reservas",
]

CLICABLES = "a[href^='#'], button, .card, .filtro-chip, .card-fav, [role='button'], summary"

# Nunca pulsar acciones destructivas o de salida.
PROHIBIDO = (
    "salir", "cerrar sesión", "cerrar sesion", "eliminar", "borrar",
    "cancelar reserva", "desactivar", "bloquear", "pagar", "comprar",
    "denunciar", "reportar", "darse de baja",
    # Login con Google abre un popup externo: el monkey lo cierra y Firebase
    # registra auth/internal-error. No es un fallo de MIRA.
    "google",
)

TEXTO_BASURA = [
    "pizza", "MIRA", "😀😀😀", "<script>alert(1)</script>", "   ",
    "a" * 80, "ñáéíóú", "'; DROP TABLE usuarios;--", "1234567890",
]

# Tamaños de ventana: escritorio y móvil (BottomNav, menús plegados...).
ESCRITORIO = (1400, 1000)
MOVIL = (390, 844)

INYECTAR = """
window.__miraErrores = window.__miraErrores || [];
if (!window.__miraEscuchando) {
  window.__miraEscuchando = true;
  window.addEventListener('error', function (e) {
    window.__miraErrores.push('error: ' + (e.message || e.type));
  });
  window.addEventListener('unhandledrejection', function (e) {
    window.__miraErrores.push('unhandledrejection: ' + String(e.reason));
  });
}
"""


class Monkey:
    def __init__(self, driver, base_url: str, seed: int = 1234, acciones: int = 50,
                 movil: bool = False):
        self.d = driver
        self.movil = movil
        self.base_url = base_url
        self.rnd = random.Random(seed)
        self.acciones_totales = acciones
        self.seed = seed
        self.incidencias: list[dict] = []
        self.registro: list[str] = []
        self._vistos: set[str] = set()

    # ---------- utilidades ----------

    def _inyectar(self) -> None:
        try:
            self.d.execute_script(INYECTAR)
        except Exception:
            pass

    def _anotar(self, incidencia: dict) -> None:
        clave = json.dumps(incidencia, sort_keys=True, ensure_ascii=False)
        if clave in self._vistos:
            return
        self._vistos.add(clave)
        self.incidencias.append(incidencia)
        self.registro.append(f"  >>> INCIDENCIA: {incidencia}")

    def _cerrar_alertas(self) -> None:
        try:
            alerta = self.d.switch_to.alert
            self.registro.append(f"  alerta aceptada: {alerta.text[:80]}")
            alerta.accept()
        except Exception:
            pass

    def _cerrar_pestañas_extra(self) -> None:
        while len(self.d.window_handles) > 1:
            self.d.switch_to.window(self.d.window_handles[-1])
            self.d.close()
            self.d.switch_to.window(self.d.window_handles[0])

    def _comprobar(self, accion: str) -> None:
        self._cerrar_alertas()
        self._cerrar_pestañas_extra()
        time.sleep(0.25)

        try:
            estado = self.d.execute_script(
                "return {raiz: (document.querySelector('#root')||{children:[]}).children.length,"
                " texto: (document.body.innerText||'').length}"
            )
        except Exception:
            estado = {"raiz": 1, "texto": 1}  # navegación en curso: no es un fallo
        if estado["raiz"] == 0 and estado["texto"] < 30:
            self._anotar({
                "tipo": "pantalla_en_blanco",
                "accion": accion,
                "url": self.d.current_url,
            })

        try:
            errores_js = self.d.execute_script("return window.__miraErrores || []")
        except Exception:
            errores_js = []
        for e in errores_js:
            self._anotar({"tipo": "error_js", "detalle": e, "accion": accion, "url": self.d.current_url})

        for e in h.errores_app(self.d):
            self._anotar({"tipo": "consola", "detalle": e, "accion": accion, "url": self.d.current_url})

    # ---------- acciones ----------

    def _candidatos(self) -> list:
        salida = []
        for el in self.d.find_elements(By.CSS_SELECTOR, CLICABLES):
            try:
                if not el.is_displayed() or not el.is_enabled():
                    continue
                texto = (el.get_attribute("innerText") or "").strip().lower()
                etiqueta = (el.get_attribute("aria-label") or "").lower()
                if any(p in texto or p in etiqueta for p in PROHIBIDO):
                    continue
                salida.append(el)
            except Exception:
                continue
        return salida

    def accion_click(self) -> str:
        candidatos = self._candidatos()
        if not candidatos:
            return "click: sin candidatos"
        el = self.rnd.choice(candidatos)
        try:
            desc = f"<{el.tag_name}> '{(el.get_attribute('innerText') or el.get_attribute('aria-label') or '')[:40].strip()}'"
        except Exception:
            desc = "<desconocido>"
        h.click_js(self.d, el)
        return f"click {desc}"

    def accion_escribir(self) -> str:
        campos = [
            c for c in self.d.find_elements(By.CSS_SELECTOR, "input, textarea")
            if c.is_displayed() and (c.get_attribute("type") or "text").lower()
            in ("text", "search", "email", "tel", "url")
        ]
        if not campos:
            return "escribir: sin campos"
        campo = self.rnd.choice(campos)
        texto = self.rnd.choice(TEXTO_BASURA)
        campo.clear()
        campo.send_keys(texto)
        if self.rnd.random() < 0.4:
            from selenium.webdriver.common.keys import Keys
            campo.send_keys(Keys.ENTER)
            return f"escribir + Enter en #{campo.get_attribute('id')}: {texto[:30]!r}"
        return f"escribir en #{campo.get_attribute('id')}: {texto[:30]!r}"

    def accion_formulario(self) -> str:
        """Selects, checkboxes, radios, fechas y números: lo que escribir() no toca."""
        controles = [
            c for c in self.d.find_elements(
                By.CSS_SELECTOR,
                "select, input[type=checkbox], input[type=radio], input[type=date],"
                " input[type=time], input[type=number], input[type=range]",
            )
            if c.is_displayed() and c.is_enabled()
        ]
        if not controles:
            return "formulario: sin controles"
        c = self.rnd.choice(controles)
        tipo = c.tag_name if c.tag_name == "select" else (c.get_attribute("type") or "").lower()
        ident = c.get_attribute("id") or c.get_attribute("name") or "?"
        if tipo == "select":
            opciones = c.find_elements(By.TAG_NAME, "option")
            if not opciones:
                return f"select #{ident}: sin opciones"
            op = self.rnd.choice(opciones)
            self.d.execute_script(
                "const s=arguments[0]; s.value=arguments[1];"
                "s.dispatchEvent(new Event('change',{bubbles:true}))",
                c, op.get_attribute("value"),
            )
            return f"select #{ident} = {op.get_attribute('value')!r}"
        if tipo in ("checkbox", "radio"):
            h.click_js(self.d, c)
            return f"{tipo} #{ident}"
        valor = {
            "date": self.rnd.choice(["2020-01-01", "2026-12-31", "2099-02-28", ""]),
            "time": self.rnd.choice(["00:00", "13:30", "23:59", ""]),
            "number": self.rnd.choice(["0", "-1", "1", "999999", "2.5"]),
            "range": self.rnd.choice(["0", "50", "100"]),
        }[tipo]
        # React escucha 'input' a través del setter nativo, no de .value directo.
        self.d.execute_script(
            "const el=arguments[0];"
            "const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;"
            "set.call(el, arguments[1]);"
            "el.dispatchEvent(new Event('input',{bubbles:true}));"
            "el.dispatchEvent(new Event('change',{bubbles:true}));",
            c, valor,
        )
        return f"{tipo} #{ident} = {valor!r}"

    def accion_rafaga(self) -> str:
        """Varios clics seguidos sobre el mismo elemento (doble envío, impaciencia)."""
        candidatos = self._candidatos()
        if not candidatos:
            return "ráfaga: sin candidatos"
        el = self.rnd.choice(candidatos)
        veces = self.rnd.randint(3, 6)
        desc = (el.get_attribute("innerText") or el.get_attribute("aria-label") or "")[:40].strip()
        for _ in range(veces):
            try:
                h.click_js(self.d, el)
            except Exception:
                break  # el elemento desapareció tras el primer clic: es lo normal
        return f"ráfaga x{veces} <{el.tag_name}> '{desc}'"

    def accion_redimensionar(self) -> str:
        self.movil = not self.movil
        ancho, alto = MOVIL if self.movil else ESCRITORIO
        self.d.set_window_size(ancho, alto)
        return f"ventana {ancho}x{alto}"

    def accion_scroll(self) -> str:
        dy = self.rnd.choice([-1200, -600, 400, 900, 1800])
        self.d.execute_script(f"window.scrollBy(0, {dy})")
        return f"scroll {dy}px"

    def accion_ruta(self) -> str:
        ruta = self.rnd.choice(RUTAS)
        h.ir_hash(self.d, ruta)
        return f"ruta {ruta}"

    def accion_atras(self) -> str:
        self.d.back()
        # Si "atrás" sale de la app (p. ej. a la página inicial del navegador,
        # data:,) no es un fallo de MIRA: volvemos a entrar.
        if not self.d.current_url.startswith(self.base_url):
            self.d.get(self.base_url + "/")
            h.esperar_main(self.d)
            return "atrás (salió de la app: vuelta a la home)"
        return "atrás"

    def accion_recarga(self) -> str:
        self.d.refresh()
        h.esperar_main(self.d)
        return "recarga"

    # ---------- bucle ----------

    def ejecutar(self) -> list[dict]:
        if self.movil:
            self.d.set_window_size(*MOVIL)
        self.d.get(self.base_url + "/")
        h.esperar_main(self.d)
        if not h.aceptar_cookies(self.d):
            # Sin banner (perfil ya consentido): no es un fallo.
            pass
        self._inyectar()
        self._comprobar("inicio")

        acciones = [
            (self.accion_click, 40),
            (self.accion_escribir, 12),
            (self.accion_formulario, 10),
            (self.accion_rafaga, 5),
            (self.accion_scroll, 12),
            (self.accion_ruta, 12),
            (self.accion_redimensionar, 2),
            (self.accion_atras, 5),
            (self.accion_recarga, 5),
        ]
        pesos = [p for _, p in acciones]
        funciones = [f for f, _ in acciones]

        for i in range(1, self.acciones_totales + 1):
            fn = self.rnd.choices(funciones, weights=pesos, k=1)[0]
            try:
                desc = fn()
            except Exception as err:  # una acción que revienta Selenium no es un bug de la app
                desc = f"{fn.__name__}: excepción {type(err).__name__}: {str(err)[:120]}"
                try:
                    self._cerrar_alertas()
                except Exception:
                    pass
            self.registro.append(f"[{i:03d}] {desc} | {self.d.current_url}")
            try:
                self._inyectar()
            except Exception:
                pass
            try:
                self._comprobar(desc)
            except Exception as err:  # no dejar que un fallo de Selenium tumbe el run
                self.registro.append(f"  (comprobación omitida: {type(err).__name__})")

        return self.incidencias


def main() -> int:
    ap = argparse.ArgumentParser(description="Monkey test de MIRA (Selenium + Edge/Chrome)")
    ap.add_argument("--base-url", default=None, help="si se omite, arranca mock-api + Vite")
    ap.add_argument("--acciones", type=int, default=100)
    ap.add_argument("--seed", type=int, default=1234)
    ap.add_argument("--visible", action="store_true", help="muestra el navegador")
    ap.add_argument("--movil", action="store_true", help="empieza con ventana de móvil (390x844)")
    ap.add_argument("--json", dest="salida", help="fichero donde volcar las incidencias")
    ap.add_argument("--log", default=str(RAIZ_QA / "artifacts" / "monkey.log"))
    args = ap.parse_args()

    from navegador import crear_driver

    monkey = None
    incidencias: list[dict] = []
    try:
        with contextlib.ExitStack() as pila:
            base_url = args.base_url or pila.enter_context(servers.servidores())
            d = crear_driver(headless=not args.visible)
            pila.callback(d.quit)
            monkey = Monkey(d, base_url, seed=args.seed, acciones=args.acciones, movil=args.movil)
            incidencias = monkey.ejecutar()
    finally:
        if monkey is not None:
            pathlib.Path(args.log).parent.mkdir(parents=True, exist_ok=True)
            pathlib.Path(args.log).write_text("\n".join(monkey.registro), encoding="utf-8")
            if args.salida:
                pathlib.Path(args.salida).write_text(
                    json.dumps(incidencias, ensure_ascii=False, indent=2), encoding="utf-8"
                )

    print(f"Acciones: {args.acciones} | seed: {args.seed} | incidencias: {len(incidencias)}")
    for inc in incidencias:
        print(" -", inc)
    print("Log:", args.log)
    return 1 if incidencias else 0


if __name__ == "__main__":
    raise SystemExit(main())
