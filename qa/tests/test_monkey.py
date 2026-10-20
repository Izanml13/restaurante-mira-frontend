"""Monkey test ejecutado dentro de pytest (y por tanto dentro de Taurus).

Semillas: --monkey-seeds 1,2,3 (un test por semilla) o --monkey-seed N.
El registro de acciones se guarda siempre en artifacts/monkey-seed<N>[-movil].log
para poder reproducir cualquier incidencia con la misma semilla.
"""
from __future__ import annotations

import json
import os

import servers
from monkey.monkey_web import Monkey

SEED_POR_DEFECTO = 20261020


def pytest_generate_tests(metafunc):
    if "seed" not in metafunc.fixturenames:
        return
    cfg = metafunc.config
    lista = cfg.getoption("--monkey-seeds") or os.environ.get("MIRA_MONKEY_SEEDS")
    if lista:
        seeds = [int(x) for x in str(lista).split(",") if x.strip()]
    else:
        seeds = [cfg.getoption("--monkey-seed")
                 or int(os.environ.get("MIRA_MONKEY_SEED", SEED_POR_DEFECTO))]
    metafunc.parametrize("seed", seeds, ids=[f"seed{s}" for s in seeds])


def test_monkey_no_rompe_la_app(driver, servidores, pytestconfig, seed):
    acciones = pytestconfig.getoption("--monkey-acciones") or int(
        os.environ.get("MIRA_MONKEY_ACCIONES", "40")
    )
    movil = pytestconfig.getoption("--monkey-movil") or os.environ.get("MIRA_MONKEY_MOVIL") == "1"

    monkey = Monkey(driver, servidores, seed=seed, acciones=acciones, movil=movil)
    try:
        incidencias = monkey.ejecutar()
    finally:
        servers.ARTIFACTOS.mkdir(parents=True, exist_ok=True)
        sufijo = "-movil" if movil else ""
        (servers.ARTIFACTOS / f"monkey-seed{seed}{sufijo}.log").write_text(
            "\n".join(monkey.registro), encoding="utf-8"
        )

    assert not incidencias, (
        f"{len(incidencias)} incidencia(s) con seed={seed}, {acciones} acciones"
        f"{' (móvil)' if movil else ''}. Reproduce con:\n"
        f"  python -m monkey.monkey_web --seed {seed} --acciones {acciones}"
        f"{' --movil' if movil else ''} --visible\n"
        + json.dumps(incidencias, ensure_ascii=False, indent=2)
    )
