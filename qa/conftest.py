"""Fixtures de la suite E2E de MIRA.

Arranca los servidores si no están levantados y prepara un navegador headless por test (Edge o Chrome, ver navegador.py).
Variables de entorno: ver servers.py.
"""
from __future__ import annotations

import sys
import time
import pathlib

import pytest

RAIZ_QA = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(RAIZ_QA))

import servers  # noqa: E402
from navegador import crear_driver  # noqa: E402


def pytest_addoption(parser):
    """Taurus no propaga `env` al executor pytest: las opciones van por CLI."""
    grupo = parser.getgroup("mira")
    grupo.addoption(
        "--unitarias", action="store_true", default=False,
        help="incluye npm test de frontend y backend en la regresión",
    )
    grupo.addoption("--monkey-acciones", type=int, default=None, help="acciones del monkey")
    grupo.addoption("--monkey-seed", type=int, default=None, help="semilla del monkey")
    grupo.addoption(
        "--monkey-seeds", default=None,
        help="varias semillas separadas por comas (un test por semilla), p. ej. 1,2,3",
    )
    grupo.addoption(
        "--monkey-movil", action="store_true", default=False,
        help="el monkey arranca con ventana de móvil (390x844)",
    )


@pytest.fixture(scope="session")
def servidores() -> str:
    with servers.servidores() as url:
        yield url


@pytest.fixture
def driver(request):
    """Navegador headless con captura de consola y screenshot automático al fallar."""
    d = crear_driver(headless=servers.HEADLESS)

    fallo: BaseException | None = None
    try:
        yield d
    except BaseException as err:  # noqa: BLE001 - queremos capturar cualquier fallo
        fallo = err
        raise
    finally:
        if fallo is not None:
            servers.ARTIFACTOS.mkdir(parents=True, exist_ok=True)
            sello = time.strftime("%Y%m%d-%H%M%S")
            nombre = request.node.name.replace("/", "_").replace("::", "_")
            try:
                d.save_screenshot(str(servers.ARTIFACTOS / f"{nombre}-{sello}.png"))
                with open(servers.ARTIFACTOS / f"{nombre}-{sello}.log", "w", encoding="utf-8") as fh:
                    fh.write(f"URL: {d.current_url}\nFALLO: {fallo!r}\n\n")
                    for entrada in d.get_log("browser"):
                        fh.write(f"{entrada['level']}: {entrada['message']}\n")
            except Exception:  # el navegador pudo haberse cerrado ya
                pass
        d.quit()
