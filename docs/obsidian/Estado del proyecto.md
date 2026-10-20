---
tags: [mira, estado]
---
# Estado del proyecto (20/10/2026)

## Ramas
| Rama | Último commit | Contenido |
|---|---|---|
| `main` | 16/09 | Rediseño UI + i18n es/ca/en + login Google |
| `feat/panel-operativo` | 22/09 | Operator Hub (`src/components/ops/*`), sidebar auto-hide |
| **`feat/mirapoints`** | 22/09 | **La más completa**: incluye panel operativo + sistema de puntos MIRA |
| `docs/guia-testing` | 20/10 | PDF guía de testing + este vault |

> [!warning] Historias desconectadas
> `main` y `feat/mirapoints` **no tienen merge base** (`git merge-base` falla): la historia se reescribió. Fusionar requerirá `--allow-unrelated-histories` o rehacer `main` desde `feat/mirapoints`. Ver [[Reparto de tareas#T1]].

## Qué trae `feat/mirapoints` frente a `main`
72 ficheros, +10.900 / −236 líneas. Autores: Rubén (≈48 commits), Alex (≈18), Izan (1).

- **Puntos MIRA** (`src/services/api.js`, `src/stores/usePointsStore.js`, `src/components/points/*`): saldo, histórico (ledger), canje, invitaciones.
- **Racha de login diario + ruleta del día 7** (`DailyStreakPopup.jsx`, `WheelModal.jsx`, `hooks/useDailyLogin.js`) — trabajo de [[Alex]].
- **Dashboard de restaurante** (`components/dashboard/*`): reservas, tickets (1 por reserva), gráficas con `recharts`, varios restaurantes por propietario.
- **Operator Hub** (`components/ops/*`): finanzas, incidencias, usuarios, restaurantes.
- **Admin por rol**: `usuarios/{uid}.tipo` = `admin` | `empresa` | usuario.
- **Promociones** (`components/promotions/*`), páginas `/puntos`, `/invitar`, `/ticket`.
- `firestore.rules` versionado (¡en una sola línea!) y `documentacion.md` (1.000 líneas).
- Nuevas deps: `zustand`, `recharts`.

## Salud técnica
- ✅ `npm run build` compila.
- ⚠️ Bundle JS **1,8 MB** (antes 1,2 MB). CSS 139 kB. `App.css` +2.300 líneas.
- ❌ Sin tests, sin linter, sin CI.
- ❌ Problemas de seguridad críticos → [[Hallazgos de revisión]].
