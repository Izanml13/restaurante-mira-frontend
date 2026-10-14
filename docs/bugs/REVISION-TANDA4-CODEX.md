# Revisión de la tanda 4 de Claude

Revisión realizada por Codex el 14 de octubre de 2026. Frontend `ddce6e0`, backend `631e695`. Worktrees `../codex-revision-tanda4` y `../codex-revision-tanda4-backend`, rama local `review/codex-claude-tanda4` en ambos. No se han modificado las implementaciones ni los checkouts de `fix/codex-tanda4`.

- BUG-114 y BUG-119: aprobados, marcados hecho.
- BUG-115, BUG-116, BUG-117 y BUG-118: conservan en revisión; observaciones y reproducciones en sus fichas.
- Tests frontend: 172/172; build correcto (avisos existentes de chunks/imports).
- Tests backend: 265/265, ejecutados con permiso para sockets locales de supertest.
- Se consultaron 100 registros del catálogo público `https://mira-api-xveu.onrender.com/v1/restaurants?limit=100` para comprobar familias y asignación de zonas. No se escribieron datos en producción ni se usaron credenciales.
- Prueba manual de Mapa y etiquetas del filtro; prueba visual aislada de DailyStreakPopup en oscuro. Crear una JAM y subir fotos con una sesión real queda sin validar manualmente; el backend sí está cubierto con Firebase simulado.

## Unión con la rama de Codex

La simulación de merge entre `fix/codex-tanda4` y `origin/fix/claude-tanda4`, base main, detecta conflictos en `docs/bugs/BUGS.md`, `docs/bugs/BUG-120.md` y `docs/bugs/BUG-121.md`. Preservar las soluciones completas y estados de Codex para BUG-120/121 y los estados/observaciones de esta revisión para BUG-114/119 y BUG-115/116/117/118. Los ficheros i18n se combinan automáticamente en estas revisiones; no se observaron conflictos textuales ahí. No se ha realizado ningún merge.

## Segunda revisión: correcciones de Claude

Frontend `d1aba21`, backend `54e21db`, revisados el 14 de octubre de 2026. Frontend 177/177 tests y build correcto; backend 265/265 tests. Frontend en rama local `review/codex-claude-tanda4-correcciones` (la primera revisión se incorporó a Claude como `6ebd1ba`, con hash distinto al commit local); backend sigue en `review/codex-claude-tanda4`.

- BUG-116, BUG-117 y BUG-118 aprobados y marcados hecho.
- BUG-115: foto local y reducción de SSE aprobadas; sigue en revisión por GET de refresco duplicados mientras hay una petición pendiente y respuestas de la sala anterior que se aplican a la actual. Reproducciones y propuesta de corrección en la ficha. No hay bucle recursivo infinito en el flujo normal, pero no se cumple una petición por cambio de versión.
- No se han modificado implementaciones. Las verificaciones adicionales usaron el callback real de Jam.jsx con promesas controladas y la muestra pública guardada en la primera revisión. No se probó una sesión/entrega real.
- BUG-120/Brevo y el aislamiento de cargas de BUG-121 ya están terminados en `fix/codex-tanda4`: frontend `f84aa48` y `9e03032`, backend `3f47cae`; 178 tests frontend, 280 backend y build frontend correcto, según la validación de esa rama. El backend no define build; sintaxis verificada. Fichas y pasos Render/Brevo están en `../codex-tanda4/docs/bugs/BUG-120.md` y BUG-121.md. No forman parte de la rama de Claude hasta que se incorporen.
