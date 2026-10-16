# R01 · Estadísticas de avisos web (2026-10-16)

Si /v1/ofertas/cerca devolvía cinco restaurantes nuevos, la web mostraba tres pero guardaba los cinco como vistos y enviaba cinco POST /avisos. Los otros dos quedaban contados sin verse y no podían aparecer después ese día.

El filtro admite un límite y la web selecciona como máximo tres avisos nuevos antes de guardar vistos y contabilizar. Los demás siguen disponibles para la siguiente consulta. La app mantiene su comportamiento: emite una notificación local para cada aviso, además de la lista de tres. No cambia el contrato público.

Regresión: cinco candidatos, primera tanda de tres, segunda de dos, sin duplicar. Validación: npm test y npm run build. Hallazgos completos en R01 de la bóveda.
