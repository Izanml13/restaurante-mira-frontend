# Prompt Codex — T9 Rendimiento
```
Repo: restaurante-mira-frontend. Rama perf/lazy-webp.
El bundle JS pesa 1,8 MB. Carga con React.lazy + Suspense (fallback con el skeleton existente) las vistas pesadas: dashboard/*, ops/*, Admin, páginas de puntos y todo lo que use recharts o leaflet. Convierte public/hero-*.jpg y los PNG de public/ (moneda, racha, mascota) a WebP < 200 kB conservando originales fuera de public/ y actualiza las referencias.
Hecho cuando: npm run build pasa y el chunk principal baja de 600 kB; indica tamaños antes/después en el PR.
```
