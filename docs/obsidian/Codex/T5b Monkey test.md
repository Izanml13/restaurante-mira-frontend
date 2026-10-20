# Prompt Codex — T5b Monkey test
```
Repo: restaurante-mira-frontend. Rama test/monkey (desde feat/mirapoints). Rubén está creando la infraestructura Selenium en test/qa-selenium-taurus: si ya existe tests/e2e/conftest.py, reutiliza su fixture driver y BASE_URL; si no, crea uno mínimo compatible (pytest + selenium, Chrome headless, BASE_URL por defecto http://localhost:4173).

Crea tests/monkey/test_monkey.py:
- Carga gremlins.js desde unpkg con versión fijada e inyéctalo con execute_script.
- Semilla fija (randomizer con seed) para que los fallos se puedan reproducir; la semilla se puede cambiar con la variable MONKEY_SEED.
- Pantallas: home, detalle de un restaurante y vista con mapa. 1000 acciones por pantalla (MONKEY_ACTIONS configurable).
- Evita salir del dominio: bloquea navegación externa y window.open, y desactiva alert/confirm.
- No usar cuentas reales ni hacer reservas reales (sin login).
- Falla si: hay errores SEVERE en la consola del navegador (ignorando ruido conocido de terceros, listado en una constante), la página queda en blanco (#root vacío) o aparece un error no capturado (window.onerror).
- Guarda captura y log de consola en tests/monkey/artifacts/ cuando falle.
README corto con cómo ejecutarlo. Sin time.sleep: usa WebDriverWait.
Hecho cuando: con `npm run build && npx vite preview` en marcha, `pytest tests/monkey` se ejecuta y el resultado es reproducible con la misma semilla.
```
