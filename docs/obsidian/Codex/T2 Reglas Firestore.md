# Prompt Codex — T2 Reglas Firestore
```
Repo: restaurante-mira-frontend, rama base feat/mirapoints. Crea la rama fix/firestore-rules.

Contexto: la app es React + Firebase sin backend; el cliente escribe directo en Firestore, así que firestore.rules es la única barrera. El fichero está en UNA sola línea.

Tareas:
1. Reformatea firestore.rules en varias líneas legibles sin cambiar semántica (commit aparte).
2. usuarios/{uid}: el propietario NO puede modificar los campos tipo, saldoPuntos, totalAcumulado, totalCanjeado, rachaLoginDias, ultimoLoginDate, graceUsados (usa diff().affectedKeys().hasAny). En create tampoco puede poner tipo distinto de ausente/'usuario' ni saldo inicial > 0.
3. puntos_movimientos: create solo si request.resource.data.uid == request.auth.uid (y más adelante solo Cloud Functions; deja un comentario TODO).
4. reservas: read solo dueño de la reserva, admin, o empresa propietaria del restaurante de la reserva.
5. resenas update: solo el autor (usuarioId). invitaciones: update solo creador o el email invitado; read no público.
6. tickets create: uid == request.auth.uid.
7. Empresa solo puede actualizar restaurantes donde resource.data.uid == request.auth.uid.
8. Añade tests con @firebase/rules-unit-testing + emulador (carpeta tests/rules/, script npm "test:rules") que demuestren: un usuario normal no puede ponerse tipo 'admin'; no puede cambiar su saldoPuntos; no puede leer reservas ajenas.

Hecho cuando: npm run test:rules pasa, npm run build pasa, y las pantallas de dashboard/ops siguen funcionando para admin y empresa (revisa qué consultas hacen en src/services/api.js y src/components/ops/opsData.js y ajusta reglas o consultas).
```
