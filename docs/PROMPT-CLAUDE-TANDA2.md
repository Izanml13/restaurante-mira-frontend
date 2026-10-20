Lee AGENTS.md y docs/bugs/BUGS.md (sección «Tanda 2»).

Te tocan los bugs asignados a «claude»: BUG-009, BUG-010, BUG-016, BUG-020, BUG-013, BUG-017 y BUG-019. No toques los de Codex (011, 012, 014, 015, 018 y 021).

Ramas y worktrees:
- Frontend: rama `fix/claude-tanda2` desde main, en la carpeta principal.
- Backend (para 013 racha y 017 MIRASI): rama `fix/claude-tanda2` en restaurante-mira-backend.
- Haz un commit por bug: `fix(scope): descripción (BUG-XXX)`.

Orden: 016 + 020 (Header) → 009 → 010 → 013 → 017 → 019 (al final, porque toca muchos archivos de texto).

Para cada bug:
1. Márcalo como `en curso (claude)`.
2. Reprodúcelo en el navegador antes de cambiar nada.
3. Haz el cambio mínimo, con tests cuando se pueda.
4. `npm test` y `npm run build` (y `npm test` en mira-api si tocas el backend).
5. Verifícalo en el navegador, en claro y en oscuro.
6. Rellena «Solución» y marca `en revisión`.

Coordinación:
- Codex hace la auditoría de seguridad del backend (BUG-014). Si deja notas sobre `modules/ai` o puntos/racha, las aplico yo.
- BUG-019: solo textos e i18n, sin tocar CSS (BUG-018 es de Codex).
- Al terminar Codex, reviso sus bugs y uno las ramas, igual que en la tanda 1.
