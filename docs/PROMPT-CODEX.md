Lee AGENTS.md y docs/bugs/BUGS.md antes de empezar.

Trabajas en paralelo con Claude en este repo. Te tocan los bugs asignados a «codex»: BUG-004, BUG-006, BUG-007 y BUG-008. No toques los de Claude (001, 002, 003 y 005).

Para cada bug, en orden:
1. Lee docs/bugs/BUG-XXX.md.
2. Marca el bug como `en curso (codex)` en BUGS.md.
3. Crea un git worktree propio con la rama `fix/BUG-XXX-descripcion-corta` desde main.
4. Haz el cambio mínimo, imitando el estilo del código que lo rodea. Añade un test en test/ si se puede testear.
5. Ejecuta `npm test` y `npm run build`; los dos tienen que pasar.
6. Haz commit en español: `fix(scope): descripción`.
7. Rellena la sección «Solución» del BUG-XXX.md y marca el bug como `en revisión`. No hagas merge a main.

Aviso: BUG-002 (de Claude) también navega a «Mis reservas». Si ves que tu cambio en Reservas.jsx choca con el suyo, para y avisa en lugar de resolver el conflicto por tu cuenta.
Al terminar, resume por bug: causa, archivos tocados y cómo se verificó.
