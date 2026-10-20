# Prompt Codex — T4 Tests de la racha
```
Repo: restaurante-mira-frontend. Rama test/racha (desde feat/points-functions si ya existe, si no desde feat/mirapoints).

Añade Vitest (devDependency, script "test"). Extrae calcRachaLogin a un módulo puro exportable (recibe datos y la fecha "hoy" como parámetro para poder testearlo).
Casos: primer login (día 1, 5 pts); día consecutivo suma 3 pts hasta máx 15; mismo día => yaReclamado; hueco de 1 día usa gracia (máx 2); hueco > 2 días reinicia a 1 y gracia 0; al llegar a 7 => dia7Disponible y 0 pts; cambio de día a medianoche en Europe/Madrid.
Hecho cuando: npm test pasa y npm run build pasa.
```
