# R01 · Sondeo de visitas (2026-10-16)

En web y app, un GET de visita lento permitía iniciar más GET cada 4 s. Si el usuario pedía un QR nuevo mientras un GET antiguo seguía en vuelo, su respuesta podía sustituir la visita nueva y dejar un QR y estado de visitas distintas. Además, los errores 401/403/404 se ignoraban hasta caducar el QR.

El sondeo admite una sola petición en vuelo, ignora respuestas tras limpiar el efecto y retira QR/visita ante errores terminales. Los fallos temporales conservan el reintento. No cambia el contrato; 409/410 pertenecen a validar el QR en el panel.

Tests: ejecución de ambos hooks con red diferida y reloj controlado; suite web y build. Las pruebas no sustituyen una prueba física de navegación en el móvil. Revisión completa y tareas de Alex en la nota R01 de la bóveda.

Validación final: 254/254 tests, build Vite correcto, `npm run lint` móvil correcto. Los 18 tests del hook pasan; contra origin/main fallan 8 (solapamiento y errores terminales), lo que reproduce los bugs. `tsc --noEmit` de proyecto no puede ejecutarse: main no contiene tsconfig.json; comprobación dirigida de sintaxis JS con tsc --noEmit --allowJs --checkJs false --moduleResolution bundler --module esnext --target es2022 --skipLibCheck src/hooks/useLlegada.js correcta. Sin prueba en dispositivo.
