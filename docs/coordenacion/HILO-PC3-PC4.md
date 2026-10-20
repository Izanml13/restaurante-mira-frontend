# Hilo PC 3 ↔ PC 4

Git como mensajería: cada mensaje es una entrada nueva abajo del todo, commit y push. Se responde citando el mensaje («re: #id»). Formato:

```
### #N · YYYY-MM-DD · de (PC X) → para (PC Y | todos)
- Mensaje:
- Acción / respuesta:
```

---

### #1 · 2026-10-15 · Ruben (PC 3) → todos
- Mensaje: Arrancamos el reparto del panel del restaurante (ofertas por geolocalización). Yo me quedo con **G04** (editor de ofertas, fase 1, rama `feat/G04-editor-ofertas` desde `origin/feat/G01-contrato-ofertas`). Marco (PC 4) se queda con **G07** (estadísticas) y **G10** (escáner QR), empezando por la preparación de G10 (jsQR + fallback manual) y G07 contra mock, sin tocar `Dashboard.jsx` hasta que se mergee G04. Instrucciones en `docs/coordenacion/PC4-INSTRUCCIONES.md`.
- Acción: Marco confirma recepción, elige el orden (G10 o G07 primero) y avisa en este hilo de su rama y de cualquier contrato asumido.

### #2 · 2026-10-15 · Ruben (PC 3) → todos
- Mensaje: **G04 listo para revisión** en `feat/G04-editor-ofertas` (commit 0204bca): `ofertasModel.js` + 8 tests, `ofertasApi.js`, `OfertasPanel.jsx` (lista, crear/editar por niveles con aviso de mejora, vigencia, borrar), integrado en `Dashboard.jsx` (botón «Ofertas» en la topbar), i18n es/ca/en. `npm test` 199/203 (los 4 fallos son preexistentes en `esperaQuitar`/`miraNuevoChat` con Node 24) y `npm run build` en verde. Nota: el mock de G01 ya incluye el endpoint de la fase 2 (`/v1/ofertas/cerca`) y PC 1 ha publicado el contrato de la fase 2 en la bóveda.
- Acción: quien revise G04 (PC 1 o PC 4), revisad y anotad en la tarea de la bóveda. Marco: podéis empezar G10/G07; si necesitáis que G04 mergee antes para integrar en `Dashboard.jsx`, avisad y lo priorizo en la revisión.

### #3 · 2026-10-15 · Ruben (PC 3) → todos
- Mensaje: **Cambio de reparto decidido**: Marco (PC 4) se queda con **toda la parte web** del proyecto de ofertas (revisión y merge de G04, G07 estadísticas, G10 escáner, avisos web de G06) y Ruben (PC 3) pasa a la **app móvil** (`mobile/`, Expo): **G06 móvil** (avisos por distancia con notificaciones locales) y **G09 móvil** (llegada a 20 m con QR), además de la **prueba en móvil de G03** (el código ya lo tienen Izan/Codex y está unido en `feat/mira-app`). Base de ramas de PC 3: `origin/feat/mira-app` (ojo: Alex/PC 2 sigue ahí con las notificaciones, coordinarse, nada de pisarse). La parte web del cliente (consentimiento/avisos en landing) queda con PC 2 salvo que acordemos otra cosa. He actualizado `PC4-INSTRUCCIONES.md` (reparto, ramas y archivos).
- Acción: Marco confirma y pasa a revisar G04 (commit `5d629e8`); Alex, avisa en la bóveda si preferís otra fecha para arrancar en `feat/mira-app`.

### #4 · 2026-10-15 · Ruben (PC 3) → todos
- Mensaje: **G04 cerrado** (commit `5d629e8`): aplicados los puntos de la revisión de PC 1 — **P2** (el error general de guardar ya se pinta también en el formulario, encima de Guardar/Cancelar) y **P3** (`estadoOferta` usa la fecha de Madrid con `hoyMadrid()`, igual que el backend, con test). `npm test` 200/204 (los mismos 4 fallos preexistentes de Node 24) y build en verde. **Prueba contra la API real**: crear → 201, recarga → persiste, segunda activa → 409, editar → persiste; oferta dejada inactiva («SMOKE TEST G04 (borrar)») para verla/borrarla desde el panel.
- Acción: a la bóveda lo he puesto a **hecho**; merge de fase pendiente por revisión. Dato para quien le interese: `GET /v1/dashboard/my-restaurants` devuelve un id de restaurante huérfano (`V2Zjzmay4kZRzuuSG56t`, «Restaurante test») que da 404 en ownership — posible `restaurantId` viejo en el perfil.
- Acción: revisión de Marco/Claude; tras el merge, Marco puede montar G07 y G10 sobre el panel.

### #3 · 2026-10-15 · Marco (PC 4) → todos
- Mensaje: Confirmo recepción (#1). Orden: **G10 primero** (escáner QR), después **G07** (estadísticas). Rama: `feat/G10-escaner-qr` desde `docs/pc4-marco` (luego `feat/G07-estadisticas-ofertas`); worktree propio en `wt-G10-escaner-qr`. No toco `Dashboard.jsx` ni `src/models/ofertasModel.js`, `src/services/ofertasApi.js` ni `OfertasPanel.jsx` (de PC 3 en G04).
- Archivos compartidos que voy a tocar (avisó según §7): `package.json` (añadir `jsqr`) y los bloques `escaner.*`/`ofertasStats.*` en `i18n/es.js`, `ca.js`, `en.js`.
- Contrato asumido G10: `POST /v1/ofertas/visitas/validar` con `{ codigo }` → 200 `{ estado: "ok", oferta: { titulo, nivel: { distancia, texto, descuentoPct } }, visitaId }` y errores 400 `CODIGO_INVALIDO`, 409 `YA_USADO`, 410 `CADUCADO`, 403 `OTRO_RESTAURANTE`. Lo dejo por escrito en `docs/coordenacion/CONTRATOS-ASUMIDOS.md` hasta que PC 1 publique el de la fase 3.
- Acción: empiezo G10; si PC 1 publica el contrato antes de que lo termine, me ajusto y aviso aquí.

### #4 · 2026-10-15 · Marco (PC 4) → todos
- Mensaje: **G10 listo para revisión** en `feat/G10-escaner-qr` (commit `cd6c820`). Componente `src/components/dashboard/OfertasEscanner.jsx`: cámara con jsQR, fallback manual siempre disponible, estados (ok/caducado/ya usado/otro restaurante/inválido/error de red) y lista de llegadas del día. Lógica pura en `src/models/escanerModel.js` con 7 tests (`test/escanerModel.test.js`). Validación contra el mock local (`resultadoMock`, ver CONTRATOS-ASUMIDOS.md) vía la prop `onValidar`: quien lo monte (PC 3, al integrar la sección de ofertas) puede cambiar la fuente al endpoint real cuando PC 1 lo publique. `package.json`: añadido `jsqr@1.4.0`. `npm test` 202/202 y `npm run build` en verde. No he tocado `Dashboard.jsx`.
- Acción: revisión cruzada de PC 3 cuando quiera; sigo con **G07** (estadísticas) en `feat/G07-estadisticas-ofertas` desde `docs/pc4-marco` (misma base que G10, ramas independientes).

### #5 · 2026-10-15 · Marco (PC 4) → todos
- Mensaje: **G07 listo para revisión** en `feat/G07-estadisticas-ofertas` (commit `2332599`). Modelo puro `src/models/ofertasStatsModel.js` (saneado con las 4 distancias fijas, series para Recharts por nivel y por fecha, resumen KPI con tasa y mejor nivel) con 7 tests en `test/ofertasStatsModel.test.js`. Componente `src/components/dashboard/OfertasStats.jsx`: KPIs, barras avisos/llegadas por distancia y línea por día, con `estadisticasMock()` como fuente hasta que exista `GET /v1/ofertas/estadisticas` (forma en CONTRATOS-ASUMIDOS.md; quien lo monte pasa `datos` por prop). Claves `ofertasStats.*` en es/ca/en (ancladas antes de `meteo` para no chocar con las `escaner.*` de G10). `npm test` 202/202 y `npm run build` en verde. No he tocado `Dashboard.jsx` ni `package.json`.
- Acción: con esto **ambas tareas mías (G10 y G07) están en revisión**. PC 3 puede revisar cuando quiera; las dos ramas son independientes de `docs/pc4-marco` y no se pisan (G07 toca `ofertasStats.*` en i18n, G10 `escaner.*`). Si PC 1 publica los contratos de fase 2/3, ajusto las fuentes reales (pasar de mock a API) y aviso aquí.

### #6 · 2026-10-15 · Marco (PC 4) → todos
- Mensaje: **G10 y G07 adaptados a los contratos oficiales publicados en la bóveda** (`Contratos API.md`, fase 3) según la revisión de Claude, y montados en el panel de ofertas (merge de `origin/feat/G04-editor-ofertas` en las dos ramas).
  - G10 `feat/G10-escaner-qr` (commit `80c751c`): `POST /v1/visitas/validar` con `{ qr }` y lista `GET /v1/visitas/restaurante?restauranteId=`; quitados `resultadoMock` y la forma `codigo`; `aLlegada()` normaliza `visita`/`aplicar`/`cliente` (nombre del cliente visible); montado en `Dashboard.jsx` con `restauranteId` del restaurante activo; fix de la revisión: si la pestaña se desmonta mientras espera `getUserMedia`, se para el stream; clave nueva `escaner.errorLista` (es/ca/en).
  - G07 `feat/G07-estadisticas-ofertas` (commit `e83287f`): modelo con la forma real `{ data: [{ fecha, avisos: {1000,500,100,20}, visitas, confirmadas }] }`, barras por nivel, líneas avisos/visitas/confirmadas, tasa = confirmadas/avisos[1000]; quitado `estadisticasMock` del componente (sin datos → «sin datos», error → mensaje + reintentar); montado en `Dashboard.jsx`; i18n es/ca/en actualizado.
  - Verificado en ambas ramas: `npm test` 212/212 (G07) y 211/211 (G10), `npm run build` en verde.
- Acción: **@Claude, ambas ramas están listas para la segunda revisión.** Para probar contra datos reales, `npm run mock-api` (rama `feat/G01-contrato-ofertas`) en paralelo al frontend.
