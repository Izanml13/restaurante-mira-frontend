# Bugs

Estados: `pendiente` · `en curso (claude)` · `en curso (codex)` · `en revisión` · `hecho`

Reparto por zonas para no tocar los mismos archivos:
- **Claude**: cards, detalle, carta y mapa (001, 002, 003, 005)
- **Codex**: cuenta, «Mis reservas» y admin (004, 006, 007, 008)

| ID | Título | Zona | Asignado | Estado | Rama |
|----|--------|------|----------|--------|------|
| [BUG-001](BUG-001.md) | Abrir restaurante al clicar la card | buscador | claude | hecho | main |
| [BUG-002](BUG-002.md) | Tras reservar, cerrar desplegable e ir a «Mis reservas» | reservas | claude | hecho | main |
| [BUG-003](BUG-003.md) | Scroll de la carta/card se propaga a la landing | buscador | claude | hecho | main |
| [BUG-004](BUG-004.md) | Preferencias/cookies con esquinas cuadradas | cuenta | codex | hecho | main |
| [BUG-005](BUG-005.md) | Filtro del mapa: solo las 4 comarcas | mapa | claude | hecho | main |
| [BUG-006](BUG-006.md) | «Mis reservas» debe abrirse siempre arriba | reservas | codex | hecho | main |
| [BUG-007](BUG-007.md) | Diseño tipo agenda en «Agenda del día» | reservas | codex | hecho | main |
| [BUG-008](BUG-008.md) | Resolver incidencia con popup de confirmación | admin | codex | hecho | main |

## Tanda 2

Ramas: **Claude** → `fix/claude-tanda2` · **Codex** → `fix/codex-tanda2` (una rama por agente, en su propio worktree).

Orden recomendado: los bugs transversales (018 tema, 019 idioma) se hacen **al final**, porque tocan muchos archivos.

| ID | Título | Zona | Asignado | Estado | Rama |
|----|--------|------|----------|--------|------|
| [BUG-009](BUG-009.md) | Icono del ojo de la contraseña roto en el registro | registro | claude | en revisión | fix/claude-tanda2 |
| [BUG-010](BUG-010.md) | Multiplicador: «x» minúscula y número centrado | cuenta | claude | en revisión | fix/claude-tanda2 |
| [BUG-011](BUG-011.md) | Botón «Marcar todo como leído» en mensajería | mensajes | codex | pendiente | |
| [BUG-012](BUG-012.md) | Botón de MIRA JAM más destacado | reservas | codex | pendiente | |
| [BUG-013](BUG-013.md) | Bugs de la racha diaria | puntos | claude | en revisión | fix/claude-tanda2 (front + back) |
| [BUG-014](BUG-014.md) | Revisión de seguridad del backend | backend | codex | pendiente | |
| [BUG-015](BUG-015.md) | «Invitar amigos» no funciona | puntos | codex | pendiente | |
| [BUG-016](BUG-016.md) | Logo MIRA del header no vuelve a la landing | header | claude | en revisión | fix/claude-tanda2 |
| [BUG-017](BUG-017.md) | Chatbot MIRASI: idioma, autoscroll y nº de recomendaciones | mira | claude | pendiente | |
| [BUG-018](BUG-018.md) | Bugs visuales en modo oscuro y claro | tema | codex | pendiente | |
| [BUG-019](BUG-019.md) | Toda la interfaz en un solo idioma | i18n | claude | pendiente | |
| [BUG-020](BUG-020.md) | Header: mostrar solo el nombre del usuario | header | claude | en revisión | fix/claude-tanda2 |
| [BUG-021](BUG-021.md) | Auditoría general de bugs de la web | general | codex | pendiente | |
