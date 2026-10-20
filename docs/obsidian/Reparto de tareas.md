---
tags: [mira, reparto, codex]
deadline: miércoles
---
# Reparto de tareas (con Codex)

Criterio: cada uno trabaja sobre el código que mejor conoce, en **ramas separadas desde `feat/mirapoints`** para no pisarse. Cada tarea tiene un prompt listo para pegar en **Codex** (carpeta `Codex/`). Codex propone el cambio → la persona lo **revisa y prueba** antes del PR.

| ID | Tarea | Responsable | Prioridad | Rama | Prompt Codex |
|---|---|---|---|---|---|
| T1 | Unificar `main` ← `feat/mirapoints` | [[Rubén]] | 🔴 | `chore/unificar-main` | — (manual, no delegar) |
| T2 | Endurecer `firestore.rules` (C1, C3, C4, A1–A4) + tests con emulador | [[Rubén]] | 🔴 | `fix/firestore-rules` | [[Codex/T2 Reglas Firestore]] |
| T3 | Puntos/racha/ruleta/canje a Cloud Functions con transacción (C2, A5, A6) | [[Alex]] | 🔴 | `feat/points-functions` | [[Codex/T3 Cloud Functions puntos]] |
| T4 | Tests unitarios de racha (`calcRachaLogin`) con Vitest | [[Alex]] | 🟠 | `test/racha` | [[Codex/T4 Tests racha]] |
| T5 | Selenium: tests de flujo + monkey test | [[Izan]] | 🟠 | `test/e2e-selenium` | [[Codex/T5 Selenium y monkey]] |
| T6 | Regresión: GitHub Actions (build + E2E en cada PR) | [[Izan]] | 🟠 | `test/e2e-selenium` | [[Codex/T6 CI regresion]] |
| T7 | Taurus 10 / 20 / 50 usuarios | [[Izan]] | 🟡 | `test/carga-taurus` | [[Codex/T7 Taurus]] |
| T8 | Diseño: verde + cards inferiores 10px | [[Izan]] | 🟡 | `style/verde-cards` | [[Codex/T8 Diseno]] |
| T9 | Rendimiento: `React.lazy` + imágenes WebP | [[Rubén]] | 🟡 | `perf/lazy-webp` | [[Codex/T9 Rendimiento]] |
| T10 | Presentación miércoles | Todos | 🟠 | — | [[Presentación miércoles]] |

## Orden
1. **T1 primero** (todo lo demás parte de ahí).
2. T2 y T3 en paralelo — son el bloqueo de seguridad.
3. T8 antes que T5/T6 → así la demo de regresión muestra el cambio de diseño pasando los tests.
4. T7 el último, con el build final.

## Reglas para trabajar con Codex
- Un prompt = una rama = un PR pequeño.
- Copiar el prompt **entero**: incluye contexto, ficheros y criterio de "hecho".
- Codex no tiene la cuenta de Firebase: nada de desplegar reglas/funciones a producción desde Codex; se prueba con el **emulador**.
- Revisar el diff a mano; `npm run build` y los tests deben pasar antes del PR.
