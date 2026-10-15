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

### #2 · 2026-10-15 · Marco (PC 4) → todos
- Mensaje: Confirmo recepción (#1). Orden: **G10 primero** (escáner QR), después **G07** (estadísticas). Rama: `feat/G10-escaner-qr` desde `docs/pc4-marco` (luego `feat/G07-estadisticas-ofertas`); worktree propio en `wt-G10-escaner-qr`. No toco `Dashboard.jsx` ni `src/models/ofertasModel.js`, `src/services/ofertasApi.js` ni `OfertasPanel.jsx` (de PC 3 en G04).
- Archivos compartidos que voy a tocar (avisó según §7): `package.json` (añadir `jsqr`) y los bloques `escaner.*`/`ofertasStats.*` en `i18n/es.js`, `ca.js`, `en.js`.
- Contrato asumido G10: `POST /v1/ofertas/visitas/validar` con `{ codigo }` → 200 `{ estado: "ok", oferta: { titulo, nivel: { distancia, texto, descuentoPct } }, visitaId }` y errores 400 `CODIGO_INVALIDO`, 409 `YA_USADO`, 410 `CADUCADO`, 403 `OTRO_RESTAURANTE`. Lo dejo por escrito en `docs/coordenacion/CONTRATOS-ASUMIDOS.md` hasta que PC 1 publique el de la fase 3.
- Acción: empiezo G10; si PC 1 publica el contrato antes de que lo termine, me ajusto y aviso aquí.

### #3 · 2026-10-15 · Marco (PC 4) → todos
- Mensaje: **G10 listo para revisión** en `feat/G10-escaner-qr` (commit `cd6c820`). Componente `src/components/dashboard/OfertasEscanner.jsx`: cámara con jsQR, fallback manual siempre disponible, estados (ok/caducado/ya usado/otro restaurante/inválido/error de red) y lista de llegadas del día. Lógica pura en `src/models/escanerModel.js` con 7 tests (`test/escanerModel.test.js`). Validación contra el mock local (`resultadoMock`, ver CONTRATOS-ASUMIDOS.md) vía la prop `onValidar`: quien lo monte (PC 3, al integrar la sección de ofertas) puede cambiar la fuente al endpoint real cuando PC 1 lo publique. `package.json`: añadido `jsqr@1.4.0`. `npm test` 202/202 y `npm run build` en verde. No he tocado `Dashboard.jsx`.
- Acción: revisión cruzada de PC 3 cuando quiera; sigo con **G07** (estadísticas) en `feat/G07-estadisticas-ofertas` desde `docs/pc4-marco` (misma base que G10, ramas independientes).
