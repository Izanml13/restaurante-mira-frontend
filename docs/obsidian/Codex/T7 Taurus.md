# Prompt Codex — T7 Taurus
```
Repo: restaurante-mira-frontend. Rama test/carga-taurus.
Crea tests/load/taurus.yml con tres escenarios ejecutables por separado (10, 20 y 50 usuarios concurrentes; ramp-up 30s/1m/1m; hold 2m/3m/5m) contra BASE_URL = http://localhost:4173 (vite preview), pidiendo la home, los assets JS/CSS principales y una página de detalle. Criterios passfail: avg-rt > 2s durante 30s o errores > 1% = fallo. Reporte final en consola y JUnit XML.
Añade tests/load/README.md: cómo instalar bzt, cómo lanzar cada escenario y un AVISO claro de no apuntar nunca a producción ni a Firebase/Geoapify (consumo de cuota).
```
