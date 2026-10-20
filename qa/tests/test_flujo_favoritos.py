"""Flujo de favoritos: marcar, contador del header y panel de guardados."""
from __future__ import annotations

import re

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

import helpers as h


@pytest.fixture
def home(driver, servidores):
    h.abrir(driver, servidores, "/")
    WebDriverWait(driver, 20).until(lambda d: len(h.tarjetas(d)) > 0)
    return driver


def _contador_favoritos(driver) -> int | None:
    enlace = driver.find_element(By.CSS_SELECTOR, "header a[href$='#/favoritos']")
    m = re.search(r"(\d+)", enlace.text)
    return int(m.group(1)) if m else None


def _titulo_panel(driver) -> str:
    return driver.find_element(By.CSS_SELECTOR, "main").text.splitlines()[0]


def test_marcar_favorito_actualiza_header_y_panel(home):
    tarjeta = h.tarjetas(home)[0]
    nombre = h.titulo_tarjeta(home, tarjeta)
    boton = tarjeta.find_element(By.CSS_SELECTOR, ".card-fav")
    assert boton.get_attribute("aria-pressed") == "false"

    h.click_js(home, boton)

    WebDriverWait(home, 5).until(lambda d: _contador_favoritos(d) == 1)
    assert boton.get_attribute("aria-pressed") == "true"

    h.ir_hash(home, "#/favoritos")
    WebDriverWait(home, 10).until(lambda d: "Mis favoritos" in d.find_element(By.CSS_SELECTOR, "main").text)
    assert _titulo_panel(home) == "Mis favoritos (1)"
    assert nombre in home.find_element(By.CSS_SELECTOR, "main").text
    assert not h.errores_app(home), h.errores_app(home)


def test_quitar_favorito_lo_saca_del_panel(home):
    tarjeta = h.tarjetas(home)[0]
    nombre = h.titulo_tarjeta(home, tarjeta)
    h.click_js(home, tarjeta.find_element(By.CSS_SELECTOR, ".card-fav"))
    WebDriverWait(home, 5).until(lambda d: _contador_favoritos(d) == 1)

    # Desde el panel se quita con el mismo corazón.
    h.ir_hash(home, "#/favoritos")
    WebDriverWait(home, 10).until(lambda d: "Mis favoritos (1)" in d.find_element(By.CSS_SELECTOR, "main").text)
    panel = home.find_element(By.CSS_SELECTOR, "main")
    boton = panel.find_element(By.CSS_SELECTOR, ".card-fav")
    h.click_js(home, boton)

    WebDriverWait(home, 5).until(lambda d: _contador_favoritos(d) is None)
    WebDriverWait(home, 5).until(lambda d: "Mis favoritos (0)" in d.find_element(By.CSS_SELECTOR, "main").text)
    assert nombre not in home.find_element(By.CSS_SELECTOR, "main").text
