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
