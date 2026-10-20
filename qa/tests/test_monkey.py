"""Monkey test ejecutado dentro de pytest (y por tanto dentro de Taurus)."""
from __future__ import annotations

import json
import os

from monkey.monkey_web import Monkey


def test_monkey_no_rompe_la_app(driver, servidores, pytestconfig):
    acciones = pytestconfig.getoption("--monkey-acciones") or int(
        os.environ.get("MIRA_MONKEY_ACCIONES", "40")
    )
    seed = pytestconfig.getoption("--monkey-seed") or int(
        os.environ.get("MIRA_MONKEY_SEED", "20261020")
    )

    monkey = Monkey(driver, servidores, seed=seed, acciones=acciones)
    incidencias = monkey.ejecutar()

    assert not incidencias, (
        f"{len(incidencias)} incidencia(s) con seed={seed} y {acciones} acciones:\n"
        + json.dumps(incidencias, ensure_ascii=False, indent=2)
    )
