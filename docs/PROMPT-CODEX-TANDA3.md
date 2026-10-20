Lee AGENTS.md y docs/bugs/BUGS.md (secciones «Hallazgos de BUG-021» y «Tanda 3») antes de empezar.

Trabajas en paralelo con Claude. Te tocan: BUG-105, BUG-106, BUG-107, BUG-108, BUG-109, BUG-110 y BUG-113. No toques los de Claude (101, 102, 103, 104, 111 y 112).

Ramas y worktrees (una rama por repo, saliendo de `fix/claude-tanda2`, NO de main):
- Frontend: worktree `../codex-tanda3` con la rama `fix/codex-tanda3`.
- Backend (para 106 y 113): worktree `../codex-tanda3-backend` del repo restaurante-mira-backend, también con la rama `fix/codex-tanda3` desde `fix/claude-tanda2`.
- Un commit por bug: `fix(scope): descripción (BUG-XXX)`.

Orden: 108 → 105 → 107 → 106 → 109 → 110 → 113.
(105–108 tocan `Dashboard.jsx`: hazlos seguidos, uno detrás de otro.)

Para cada bug:
1. Lee la ficha y márcala como `en curso (codex)` en BUGS.md.
2. Reprodúcelo primero (tienes reproducciones en docs/bugs/reproducciones/).
3. Haz el cambio mínimo, imitando el estilo del código que lo rodea. Añade tests cuando se pueda; si es un bug de datos (CSV, contadores), el test es obligatorio.
4. Ejecuta `npm test` y `npm run build` en el frontend, y `npm test` en mira-api si has tocado el backend.
5. Rellena «Solución» y marca el bug como `en revisión`. Sin merge ni push.

Reglas:
- No traduzcas ni muevas textos a i18n en `Dashboard.jsx` ni en los paneles Ops: eso es BUG-112 de Claude y va después. Si añades un texto nuevo, ponlo ya en i18n (es/ca/en).
- BUG-113: no toques `modules/points` ni `modules/ai`. Para CORS, la lista de dominios va en una variable de entorno con un valor por defecto seguro, y lo documentas en mira-api/docs/api.md. Si cambia algo que obligue a configurar Render o Vercel, apúntalo en la ficha.
- Si un cambio del backend altera un contrato, documéntalo en api.md e indica el orden de despliegue.

Al terminar, resume por bug: causa, archivos, cómo lo verificaste y qué queda pendiente.
