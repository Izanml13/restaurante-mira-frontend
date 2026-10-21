# Prompt Codex — T3 Cloud Functions de puntos
```
Repo: restaurante-mira-frontend, rama base feat/mirapoints. Crea la rama feat/points-functions.

Problema: en src/services/api.js, pointsApi.dailyLogin, claimWheelReward, redeem y review calculan puntos y hacen Math.random() en el navegador y escriben saldoPuntos con updateDoc. Un usuario puede falsificar puntos.

Tareas:
1. Crea carpeta functions/ (Firebase Functions v2, Node 20, JS) con callables: dailyLogin, spinWheel, redeem(puntos).
2. Mueve calcRachaLogin, WHEEL_PRIZES y spinWheel al servidor. Usa la zona horaria Europe/Madrid para calcular "hoy" (ahora usa toISOString en UTC).
3. Cada callable usa runTransaction: lee usuarios/{uid}, valida (ruleta solo si rachaLoginDias >= 7 y no reclamada hoy; canje con saldo suficiente y puntos > 0 entero), actualiza saldo y crea el documento en puntos_movimientos dentro de la misma transacción.
4. En el cliente, pointsApi llama a las funciones con httpsCallable (firebase/functions) manteniendo la misma forma de respuesta, para no tocar usePointsStore, DailyStreakPopup ni WheelModal.
5. Elimina la lógica duplicada de useDailyLogin.js o haz que delegue en usePointsStore.
6. Documenta en documentacion.md cómo arrancar el emulador de functions.

Hecho cuando: npm run build pasa, las funciones arrancan en el emulador y el popup de racha + ruleta funciona contra el emulador. No despliegues a producción.
```
