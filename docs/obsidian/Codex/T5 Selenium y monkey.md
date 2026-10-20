# Prompt Codex — T5 Selenium + monkey test
```
Repo: restaurante-mira-frontend. Rama test/e2e-selenium.

Crea tests/e2e/ en Python con pytest + selenium (Chrome headless), requirements.txt y conftest.py con fixture driver y BASE_URL (por defecto http://localhost:4173, la de `vite preview`).
Añade atributos data-testid en los componentes que haga falta (SearchBar, RestaurantCard, RestaurantDetail, botón reservar, selector de idioma) sin cambiar estilos.
Tests de flujo:
- test_busqueda: buscar una ciudad -> aparecen cards.
- test_detalle: clic en la primera card -> se ve el detalle.
- test_idioma: cambiar a EN y CA -> cambia un texto conocido sin recargar.
- test_login_form_valida: login con email inválido muestra error (sin credenciales reales).
Monkey test: tests/e2e/test_monkey.py inyecta gremlins.js (desde unpkg, versión fijada) en la home, lanza 1000 acciones con semilla fija y falla si hay errores SEVERE en la consola del navegador.
Usa WebDriverWait, nunca time.sleep. README corto en tests/e2e/README.md.
Hecho cuando: con `npm run build && npx vite preview` en marcha, `pytest tests/e2e` pasa en local.
```
