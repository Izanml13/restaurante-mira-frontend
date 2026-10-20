Lee AGENTS.md y docs/bugs/BUGS.md (sección «Tanda 2») antes de empezar.

Trabajas en paralelo con Claude. Te tocan los bugs asignados a «codex»: BUG-011, BUG-012, BUG-014, BUG-015, BUG-018 y BUG-021. No toques los de Claude (009, 010, 013, 016, 017, 019 y 020).

Ramas y worktrees (una sola rama por repo):
- Frontend: worktree `../codex-tanda2` con la rama `fix/codex-tanda2` creada desde main.
- Backend (para 011, 014 y 015): worktree `../codex-tanda2-backend` del repo restaurante-mira-backend, también con la rama `fix/codex-tanda2` desde main.
- Haz un commit por bug, en español: `fix(scope): descripción (BUG-XXX)`.

Orden: 015 → 011 → 012 → 014 → 018 → 021.

Para cada bug:
1. Lee docs/bugs/BUG-XXX.md y márcalo como `en curso (codex)` en BUGS.md.
2. Reprodúcelo primero y entiende la causa antes de cambiar nada.
3. Haz el cambio mínimo, imitando el estilo del código que lo rodea. Añade tests cuando se pueda.
4. Ejecuta `npm test` y `npm run build` en el frontend, y `npm test` en mira-api si has tocado el backend. Todo tiene que pasar.
5. Rellena «Solución» (causa, archivos, cómo lo verificaste) y marca el bug como `en revisión`. No hagas merge a main ni push.

Reglas para evitar conflictos con Claude:
- Claude va a tocar en el backend `modules/ai` y lo relacionado con puntos/racha. En BUG-014 (seguridad), si encuentras algo ahí, no lo edites: apúntalo en la ficha para que lo haga Claude.
- En BUG-018 (tema claro/oscuro) toca solo CSS y variables. No cambies textos (eso es BUG-019 de Claude) ni Header.jsx (BUG-016 y BUG-020).
- Si el backend cambia de contrato (body o respuesta de un endpoint), apúntalo en la ficha y en mira-api/docs/api.md, e indica el orden de despliegue.

BUG-021 (auditoría general): usa subagentes de Codex para revisar la web por zonas (buscador/cards, ficha/carta, reservas, mapa, cuenta/puntos, mensajería, panel admin/ops, dashboard de restaurante, MIRASI, móvil 390 px). No arregles nada en este bug: por cada bug real y reproducible, crea una ficha docs/bugs/BUG-1XX.md (empezando en BUG-101) con la plantilla y pasos para reproducir, y añádela a BUGS.md como `pendiente` sin asignar. No dupliques bugs que ya existan en la tanda 1 o la tanda 2.

Al terminar, resume por bug: causa, archivos tocados, cómo se verificó y qué queda pendiente.
