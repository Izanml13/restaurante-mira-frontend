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
