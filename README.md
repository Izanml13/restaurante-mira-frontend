# MIRA — ¿Dónde comemos hoy?

Landing + buscador de restaurantes de Cataluña con datos reales de Firestore:
690 locales con 50 reseñas cada uno, filtro por zona, distancia real desde tu
ubicación, fichas con mapa, cuentas de usuario y formulario de contacto.

Todo el filtrado es 100% cliente. Sin backend propio.

---

## Qué incluye

| Apartado | Descripción |
|---|---|
| Landing | Hero fotográfico, cifras reales, atajos por cocina y franja de ventajas |
| Buscador | Texto (insensible a tildes), cocina, zona, precio, distancia y 4 órdenes |
| Fichas | Foto, nota Yelp + nota MIRA, dirección, teléfono, mapa OSM y las 50 reseñas |
| Cuentas | Registro, inicio de sesión y página "Mi cuenta" con Firebase Auth |
| Contacto | Formulario (reserva, sugerencia, incidencia) que guarda en Firestore |

## Rutas

| Ruta | Página |
|---|---|
| `#/` | Landing + buscador |
| `#/login` | Iniciar sesión |
| `#/registro` | Crear cuenta |
| `#/cuenta` | Mi cuenta (protegida, pide login) |
| `#/contacto` | Formulario de contacto |

## Tecnologías

| Capa | Stack |
|---|---|
| App | Vite 5 + React 18 + CSS puro (sin librerías de UI) |
| Datos | Firebase Firestore (690 restaurantes de Cataluña) |
| Auth | Firebase Authentication (email + contraseña) |
| Mapas | Embed de OpenStreetMap (gratis, sin claves) |

## Arquitectura MVC adaptada a React

```
src/
├── models/       # Tipos JSDoc + helpers puros (normalizeText, haversineKm…)
├── data/         # Mocks de respaldo (la app usa Firestore)
├── services/     # Lecturas y reglas: restaurantApi, filterService, authApi…
├── controllers/  # Hooks: useRestaurantController (filtros+detalle), useAuth
├── components/   # Views puras: solo props, nunca importan el Model
├── styles/       # tokens.css (paleta y tipografía)
├── App.jsx       # Orquestador + rutas hash
└── main.jsx
```

Regla de la casa: las Views no importan el Model; solo el Controller habla con él.

## Puesta en marcha

```powershell
cd Frontend
npm.cmd install
npm.cmd run dev      # http://localhost:5173
npm.cmd run build    # genera dist/
npm.cmd run preview  # sirve el build en local
```

> En CMD escribe el comando limpio: lo que vaya detrás de `#` se ejecuta
> como argumento y rompe Vite. Nada de `npm.cmd run dev # comentario`.

## Conectar tu Firebase (2 pasos)

**1. Config web** en `src/services/firebaseConfig.js`
([Consola](https://console.firebase.google.com/) → Configuración del
proyecto → Tus apps → Web `</>`). Es clave pública por diseño; la protegen
las reglas, no el secreto.

**2. Reglas** en Firestore → Reglas (lectura pública en `restaurants`,
solo crear en `contactos`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /restaurants/{id} {
      allow read: if true;
      allow write: if false;
    }
    match /contactos/{id} {
      allow read: if false;
      allow create: if request.resource.data.mensaje is string
        && request.resource.data.mensaje.size() > 0
        && request.resource.data.mensaje.size() <= 2000;
    }
  }
}
```

Además, en Authentication → Método de inicio de sesión, activa
**Correo electrónico/contraseña** (si no, el registro falla).

## Costes (plan Spark, gratis)

| Acción | Coste aprox. |
|---|---|
| Abrir la web | ~690 lecturas (1 por restaurante, docs completos) |
| Filtrar / ordenar | 0 (todo en cliente) |
| Crear cuenta / entrar | 0 en Firestore |
| Enviar contacto | 1 escritura |

Unas 70 visitas/día entran en cuota. Si el tráfico crece, el paso natural es
mover `resenas` a una subcolección y cargarla solo al abrir el detalle.

## Flujos para probar

- Sin filtros → "690 de 690 restaurantes".
- `sushi` + `€€` + zona Barcelona → solo japoneses de precio medio.
- `méxico` (con tilde) → encuentra igual (búsqueda normalizada).
- Activa la ubicación → distancias reales y filtro por km.
- `#/registro` → crea cuenta → "Hola, {nombre}" → `#/cuenta` → salir.
- `#/contacto` → envía un mensaje → aparece en Firestore → `contactos`.

## Scripts con datos

La carpeta hermana `Restaurante_Mira/` (fuera de este repo) contiene los
scripts de Node que llenan Firestore desde Yelp + Faker/IA:

```powershell
node index.js    # extrae, genera 50 reseñas y sube
node borrar.js   # vacía la colección (cuidado: full-scan = lecturas)
node ver-uno.js --zonas  # conteo por zona
```
