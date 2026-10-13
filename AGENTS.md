# AGENTS.md — Instrucciones para agentes (Codex y Claude)

Fuente única de verdad para cualquier agente que trabaje en este repo.

## Proyecto
Frontend de Restaurante Mira: landing + buscador de restaurantes, reservas, dashboard y facturación/reporte fiscal.
- Stack: Vite 5 + React 18, Zustand, Firebase, Leaflet/react-leaflet, Recharts.
- Carpeta `mobile/`: app móvil (no tocar salvo que el bug lo indique).
- Documentación funcional: `documentacion.md`.

## Comandos
- `npm run dev` — servidor de desarrollo
- `npm run dev:mock` + `npm run mock-api` — desarrollo con API simulada (puerto 3001)
- `npm test` — tests (`node --test test/*.test.js`)
- `npm run build` — build de producción (debe pasar antes de cerrar un bug)

## Flujo de trabajo de bugs
1. Los bugs están en `docs/bugs/`. Índice en `docs/bugs/BUGS.md`; detalle en `docs/bugs/BUG-XXX.md`.
2. Antes de empezar, marca el bug como `en curso (codex)` o `en curso (claude)` en BUGS.md. No cojas un bug que ya esté en curso por otro agente.
3. Una rama por bug: `fix/BUG-XXX-descripcion-corta`. Si se trabaja en paralelo, usa un git worktree propio.
4. Al terminar: rellena la sección «Solución» del BUG-XXX.md, ejecuta `npm test` y `npm run build`, y marca el bug como `en revisión`.
5. El otro agente revisa el cambio antes del merge → `hecho`.

## Convenciones
- Commits en español con Conventional Commits: `fix(scope): descripción` (scopes usados: dashboard, fiscal, buscador, data-test…).
- Cambios mínimos y centrados en el bug; nada de refactors no pedidos.
- Imita el estilo del código que rodea al cambio.
- Si un fix es testeable, añade o actualiza un test en `test/`.
