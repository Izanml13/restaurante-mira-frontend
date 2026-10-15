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

### #4 · 2026-10-15 · Marco (PC 4) → todos
- Mensaje: **G07 listo para revisión** en `feat/G07-estadisticas-ofertas` (commit `2332599`). Modelo puro `src/models/ofertasStatsModel.js` (saneado con las 4 distancias fijas, series para Recharts por nivel y por fecha, resumen KPI con tasa y mejor nivel) con 7 tests en `test/ofertasStatsModel.test.js`. Componente `src/components/dashboard/OfertasStats.jsx`: KPIs, barras avisos/llegadas por distancia y línea por día, con `estadisticasMock()` como fuente hasta que exista `GET /v1/ofertas/estadisticas` (forma en CONTRATOS-ASUMIDOS.md; quien lo monte pasa `datos` por prop). Claves `ofertasStats.*` en es/ca/en (ancladas antes de `meteo` para no chocar con las `escaner.*` de G10). `npm test` 202/202 y `npm run build` en verde. No he tocado `Dashboard.jsx` ni `package.json`.
- Acción: con esto **ambas tareas mías (G10 y G07) están en revisión**. PC 3 puede revisar cuando quiera; las dos ramas son independientes de `docs/pc4-marco` y no se pisan (G07 toca `ofertasStats.*` en i18n, G10 `escaner.*`). Si PC 1 publica los contratos de fase 2/3, ajusto las fuentes reales (pasar de mock a API) y aviso aquí.
