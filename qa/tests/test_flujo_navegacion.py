"""Regresión de navegación: todas las rutas públicas renderizan su página.

Detecta lo que rompe silenciosamente un despliegue: rutas en blanco, páginas
que caen al 404, errores de consola al montar.
"""
from __future__ import annotations

import pytest
from selenium.webdriver.common.by import By

import helpers as h

# (hash, texto que debe aparecer en <main>)
RUTAS = [
    ("#/descubrir", "Los mejor valorados"),
    ("#/mapa", "Mapa por zonas"),
    ("#/contacto", "Contacto"),
    ("#/login", "Iniciar sesión"),
    ("#/registro", "Crear cuenta"),
    ("#/app", "bolsillo"),
    ("#/privacidad", "Privacidad"),
    ("#/favoritos", "Mis favoritos"),
    ("#/puntos", "Puntos"),
    # Ruta protegida: sin sesión debe mandar al login, no quedar en blanco.
    ("#/reservas", "Iniciar sesión"),
]


@pytest.mark.parametrize("ruta,esperado", RUTAS)
def test_ruta_renderiza(driver, servidores, ruta, esperado):
    h.abrir(driver, servidores, "/")
    h.ir_hash(driver, ruta)

    main = driver.find_element(By.CSS_SELECTOR, "main")
    texto = main.text
    assert texto.strip(), f"{ruta} quedó en blanco"
    assert esperado.lower() in texto.lower(), f"{ruta}: no aparece '{esperado}' en {texto[:120]!r}"

    errores = h.errores_app(driver)
    assert not errores, f"{ruta} con errores de consola: {errores}"
