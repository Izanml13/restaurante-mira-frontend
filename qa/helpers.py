"""Utilidades compartidas por los tests E2E."""
from __future__ import annotations

import time

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

TIMEOUT = 15

# Ruido que no viene de la aplicación: chrome interno del navegador, favicon,
# imágenes/teselas de terceros, servicios del propio navegador.
_RUIDO = (
    "edge://", "chrome-extension://", "favicon.ico", "about:blank",
    # Chromium sin clave de Google: el proveedor de geolocalización devuelve 400.
    "Network location provider",
)


def esperar_main(driver, timeout: float = TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "main"))
    )


def aceptar_cookies(driver) -> bool:
    """Acepta el banner si aparece. Devuelve True si lo cerró."""
    try:
        boton = WebDriverWait(driver, 3).until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(normalize-space(.), 'Aceptar todas')]")
            )
        )
        driver.execute_script("arguments[0].click()", boton)
        WebDriverWait(driver, 5).until(
            EC.invisibility_of_element_located(
                (By.XPATH, "//button[contains(normalize-space(.), 'Aceptar todas')]")
            )
        )
        return True
    except Exception:
        return False


def abrir(driver, base_url: str, ruta: str = "/") -> None:
    """Navegación completa + cierre del banner de cookies."""
    driver.get(base_url + ruta)
    esperar_main(driver)
    aceptar_cookies(driver)


def ir_hash(driver, hash_ruta: str) -> None:
    """Cambia solo el hash (SPA, sin recarga)."""
    driver.execute_script("window.location.hash = arguments[0]", hash_ruta)
    time.sleep(0.4)


def tarjetas(driver) -> list:
    return driver.find_elements(By.CSS_SELECTOR, "article.card")


def titulo_tarjeta(driver, tarjeta) -> str:
    return driver.execute_script(
        "return (arguments[0].querySelector('.card-titulo') || {}).textContent || ''", tarjeta
    ).strip()


def texto(el) -> str:
    """Texto real del elemento, ignorando CSS que oculte el nodo a Selenium."""
    return el.get_attribute("innerText") or el.text or ""


def textos_tarjetas(driver) -> list[str]:
    return [texto(t) for t in tarjetas(driver)]


def scroll_a(driver, el) -> None:
    driver.execute_script("arguments[0].scrollIntoView({block:'center'})", el)
    time.sleep(0.2)


def click_js(driver, el) -> None:
    """Click por JS: evita interceptaciones de overlays y elementos fuera de viewport."""
    scroll_a(driver, el)
    driver.execute_script("arguments[0].click()", el)


def errores_app(driver) -> list[str]:
    """Errores SEVERE de consola que sí son responsabilidad de la app."""
    salida = []
    for entrada in driver.get_log("browser"):
        if entrada["level"] != "SEVERE":
            continue
        msg = entrada["message"]
        if any(ruido in msg for ruido in _RUIDO):
            continue
        # Fallos de red de recursos externos (Unsplash, teselas de Leaflet...).
        if ("net::ERR_" in msg or "Failed to load resource" in msg) and "localhost" not in msg:
            continue
        salida.append(msg)
    return salida


def captura(driver, nombre: str, carpeta) -> str:
    carpeta.mkdir(parents=True, exist_ok=True)
    ruta = carpeta / f"{nombre}.png"
    driver.save_screenshot(str(ruta))
    return str(ruta)
