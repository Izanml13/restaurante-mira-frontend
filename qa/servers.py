"""Ciclo de vida de los servidores de QA (mock API + Vite).

Lo usan tanto la fixture de pytest como el CLI del monkey, para que cualquier
entrada arranque el entorno por sí sola.

Variables de entorno:
  MIRA_BASE_URL   frontend (por defecto http://localhost:5173)
  MIRA_API_URL    mock API (por defecto http://localhost:3101)
  MIRA_HEADLESS   0 para ver el navegador
  MIRA_ARTIFACTS  carpeta de capturas/logs
"""
from __future__ import annotations

import contextlib
import os
import pathlib
import subprocess
import time
import urllib.error
import urllib.request

RAIZ_QA = pathlib.Path(__file__).resolve().parent
RAIZ_FRONT = RAIZ_QA.parent

BASE_URL = os.environ.get("MIRA_BASE_URL", "http://localhost:5173").rstrip("/")
# Puerto propio: en este equipo el 3001 lo ocupa un agente corporativo (AMAgent)
# y Windows permite dos listeners (0.0.0.0 y 127.0.0.1), así que "localhost"
# podía acabar hablando con el servicio equivocado.
API_URL = os.environ.get("MIRA_API_URL", "http://localhost:3101").rstrip("/")
HEADLESS = os.environ.get("MIRA_HEADLESS", "1") not in ("0", "false", "False")
ARTIFACTOS = pathlib.Path(os.environ.get("MIRA_ARTIFACTS", RAIZ_QA / "artifacts"))

# Windows necesita npm.cmd; Linux/macOS usan npm.
NPM = "npm.cmd" if os.name == "nt" else "npm"


def responde(url: str, timeout: float = 2.0) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return 200 <= r.status < 400
    except (urllib.error.URLError, OSError):
        return False


def esperar(url: str, limite: float = 90.0) -> None:
    fin = time.time() + limite
    while time.time() < fin:
        if responde(url):
            return
        time.sleep(0.5)
    raise RuntimeError(
        f"El servidor no respondió en {limite:.0f}s: {url}. "
        f"¿Puerto ocupado por otro proceso? (MIRA_BASE_URL / MIRA_API_URL)"
    )


def _lanzar(args: list[str], env_extra: dict[str, str] | None = None) -> subprocess.Popen:
    env = os.environ.copy()
    env.update(env_extra or {})
    return subprocess.Popen(
        args,
        cwd=str(RAIZ_FRONT),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        shell=False,
    )


def _matar(proc: subprocess.Popen) -> None:
    if proc.poll() is not None:
        return
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    else:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()


@contextlib.contextmanager
def servidores():
    """Devuelve la URL del frontend, arrancando mock-api + Vite si hace falta."""
    if responde(BASE_URL):
        yield BASE_URL
        return

    puerto_api = API_URL.rsplit(":", 1)[-1]
    mock = _lanzar([NPM, "run", "mock-api"], {"MOCK_PORT": puerto_api})
    vite = _lanzar(
        [NPM, "run", "dev", "--", "--port", "5173", "--strictPort"],
        {"VITE_API_URL": API_URL},
    )
    try:
        esperar(f"{API_URL}/v1/restaurants/count")
        esperar(BASE_URL)
        yield BASE_URL
    finally:
        _matar(vite)
        _matar(mock)
