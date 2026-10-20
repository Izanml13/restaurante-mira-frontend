---
tags: [mira, testing]
---
# Plan de testing
Guía completa en PDF: `docs/Guia_Testing_Restaurante_Mira.pdf`.

| Tipo | Qué es | Aplicado a MIRA |
|---|---|---|
| **Monkey** | Clics/teclas aleatorios; solo busca que no se rompa | gremlins.js sobre home, detalle y dashboard |
| **Selenium** | Herramienta que maneja un navegador real | Base de todos los E2E |
| **Flujo (E2E)** | Recorrido completo de usuario | Búsqueda → detalle → reserva; login; cambio de idioma; racha diaria |
| **Regresión** | Repetir todos los tests tras cada cambio | GitHub Actions en cada push/PR |
| **Carga (Taurus)** | Muchos usuarios a la vez | 10 → 20 → 50 usuarios contra `vite preview`, **nunca** producción |

## Tests nuevos que pide `feat/mirapoints`
- [ ] Usuario normal **no puede** ponerse `tipo: 'admin'` (test de reglas con el emulador de Firebase) → [[Hallazgos de revisión#🔴 Críticos|C1]]
- [ ] Usuario **no puede** modificar `saldoPuntos` → C2
- [ ] Racha: día 1→2 suma, salto de 2 días usa gracia, día 7 abre ruleta (test unitario de `calcRachaLogin`)
- [ ] Canjear con saldo insuficiente da error
- [ ] Empresa solo ve reservas de **su** restaurante

Responsables: [[Reparto de tareas]].
