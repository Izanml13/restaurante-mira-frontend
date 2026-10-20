Lee AGENTS.md y docs/bugs/BUGS.md («Tanda 3»).

Te tocan: BUG-101, BUG-102, BUG-103, BUG-104, BUG-111 y BUG-112. No toques los de Codex (105–110, 113).

Ramas: `fix/claude-tanda3` desde `fix/claude-tanda2`, en frontend y backend (111). Un commit por bug.

Orden: 104 → 101 → 103 → 102 → 111 → (unir la rama de Codex) → 112.

Para cada bug: márcalo `en curso (claude)`, reprodúcelo en el navegador o con test, haz el cambio mínimo con tests, ejecuta `npm test` y `npm run build`, verifícalo y rellena «Solución».
BUG-112 va al final, después de revisar y unir la rama de Codex, porque toca `Dashboard.jsx` y los paneles Ops.
