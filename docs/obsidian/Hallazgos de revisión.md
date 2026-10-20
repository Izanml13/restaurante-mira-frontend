---
tags: [mira, revision, seguridad]
rama: feat/mirapoints
---
# Hallazgos de revisión — `feat/mirapoints`

> [!danger] Causa raíz
> Toda la lógica de puntos (sumar, ruleta, canjear) se ejecuta **en el navegador** y escribe directamente en Firestore. Cualquier usuario puede abrir la consola y llamar a Firestore con los valores que quiera. Las reglas actuales no lo impiden.

## 🔴 Críticos
| # | Problema | Dónde | Cómo se explota |
|---|---|---|---|
| C1 | **Escalada a admin** | `firestore.rules` → `usuarios/{uid}: allow update: if isOwner(uid)` | El usuario hace `updateDoc(usuarios/miUid, {tipo:'admin'})` y obtiene acceso al Operator Hub y a todo lo que use `isAdmin()` |
| C2 | **Puntos infinitos** | misma regla + `api.js` `dailyLogin` / `claimWheelReward` | `updateDoc(..., {saldoPuntos: 999999})` o repetir la ruleta (`Math.random()` en cliente) |
| C3 | **Movimientos de puntos falsos** | `puntos_movimientos: allow create: if isSignedIn()` | Se puede crear un movimiento con cualquier `uid` y `puntos` |
| C4 | **Reservas de todos visibles** | `reservas: allow read: if isSignedIn()` | Cualquier usuario logueado lee nombre/teléfono/email de todas las reservas (RGPD) |

## 🟠 Altos
| # | Problema | Dónde |
|---|---|---|
| A1 | `resenas: allow update: if isSignedIn()` → cualquiera edita reseñas ajenas | `firestore.rules` |
| A2 | `invitaciones: allow update: if isSignedIn()` → aceptar/robar invitaciones ajenas; `read: if true` expone emails | `firestore.rules` |
| A3 | `tickets: allow create: if isSignedIn()` sin validar `uid` | `firestore.rules` |
| A4 | `isEmpresa()` puede editar **cualquier** restaurante y **cualquier** reserva, no solo las suyas | `firestore.rules` |
| A5 | `redeem()` hace leer-y-luego-restar sin transacción → doble canje concurrente | `src/services/api.js:148` |
| A6 | Racha usa `toISOString()` (UTC): en España el "día" cambia a las 01:00/02:00 | `api.js` `calcRachaLogin` |

## 🟡 Medios
- `main` y `feat/mirapoints` sin historia común → merge complicado.
- `firestore.rules` en **una sola línea**: imposible de revisar en un diff.
- Bundle 1,8 MB → `React.lazy` para dashboard/ops/recharts/leaflet.
- Imágenes PNG de ~200 kB (`moneda-mira.png`, `racha-fuego.png`, `mascota-racha.png`) + hero JPG de 1,5–2 MB → WebP.
- `restaurants` se enlazan con el propietario **por nombre/email** (`listMyRestaurants`, "self-heal uid") → frágil; debería ser un `ownerUid`.
- `useDailyLogin` y `usePointsStore.claimDailyLogin` duplican lógica.
- `App.css` de ~3.000 líneas.

## ✅ Bien hecho
- Separación clara services / stores / components.
- i18n completo es/ca/en.
- Reglas para `negocios` y `mensajes` bien restringidas (`affectedKeys().hasOnly(['leido'])`).
- Tickets limitados a 1 por reserva.

## Solución recomendada
Mover la lógica de puntos a **Cloud Functions** (callable `dailyLogin`, `spinWheel`, `redeem`) con transacciones, y en las reglas prohibir que el cliente toque `tipo`, `saldoPuntos`, `totalAcumulado`, `totalCanjeado`, `rachaLoginDias`:
```
allow update: if isOwner(uid)
  && !request.resource.data.diff(resource.data).affectedKeys()
       .hasAny(['tipo','saldoPuntos','totalAcumulado','totalCanjeado','rachaLoginDias','ultimoLoginDate','graceUsados']);
```
Tareas: [[Reparto de tareas#T2]], [[Reparto de tareas#T3]].
