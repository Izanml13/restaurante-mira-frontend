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
| Buscador | Texto (insensible a tildes), cocina, zona, precio, distancia, día/hora y 4 órdenes |
| Fichas | Foto, nota Yelp + nota MIRA, dirección, teléfono, mapa, carta y reseñas Yelp/MIRA |
| Carta libro | Modal con portada temática por cocina y páginas (doble en desktop) |
| Dieta | Vegano/vegetariano/sin gluten + 7 alergias; oculta locales con <2 platos aptos |
| Favoritos | Corazón en cards, contador en header, `#/favoritos` y comparador de hasta 3 |
| Reservas | Slots fijos con cupo por nota Yelp, Mis reservas y cancelación |
| Cuentas | Registro (cliente/empresa), login, "Mi cuenta" y panel `#/admin` |
| Contacto | Formulario (reserva, sugerencia, incidencia) que guarda en Firestore |
| Empresa | Propuesta de locales con acceso, infantil y alérgenos; el admin aprueba |

## Rutas

| Ruta | Página |
|---|---|
| `#/` | Landing + buscador |
| `#/login` | Iniciar sesión |
| `#/registro` | Crear cuenta |
| `#/cuenta` | Mi cuenta (dieta, negocio, reservas, incidencias, reseñas) |
| `#/contacto` | Formulario de contacto |
| `#/reservas` | Mis reservas (próximas/pasadas/canceladas) |
| `#/favoritos` | Guardados + comparador de cartas (máx 3) |
| `#/negocio` | Proponer restaurante (cuentas empresa) |
| `#/admin` | Incidencias y locales pendientes (solo allowlist) |

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

**2. Reglas** en Firestore → Reglas. Sin este paso fallan reservas,
reseñas, likes y "Mis reservas" (permiso denegado). Dos formas:

- Automática: `node setup-colecciones.js` desde `Restaurante_Mira/`
  (crea `resenas`/`reservas` y despliega las reglas vía API; con
  `--admin UID` además te da rol admin).
- Manual: pega el bloque de abajo. Para dar acceso admin, crea el doc
  `admins/{uid}` (contenido libre, p. ej. `{rol:'admin'}`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isOwner(uid) { return isSignedIn() && request.auth.uid == uid; }
    function isAdmin() {
      return isSignedIn()
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /restaurants/{id} {
      allow read: if true;
      // Crear: cualquier logueado con forma válida (lo usa Aprobar del admin;
      // sin backend propio no hay otra vía).
      allow create: if isSignedIn()
        && request.resource.data.nombre is string
        && request.resource.data.nombre.size() > 0
        && request.resource.data.ciudad is string
        && request.resource.data.precio in ['€','€€','€€€'];
      allow update, delete: if false;
    }
    // Perfiles: cada uno solo el suyo.
    match /usuarios/{uid} {
      allow read, write: if isSignedIn() && request.auth.uid == uid;
    }
    // Propuestas de empresa: crear logueado validado, leer dueño o admin,
    // cambiar estado solo admin.
    match /negocios/{id} {
      allow read: if isOwner(resource.data.uid) || isAdmin();
      allow create: if isSignedIn()
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.nombre is string
        && request.resource.data.nombre.size() > 0
        && request.resource.data.estado == 'pendiente';
      allow update: if isAdmin();
      allow delete: if false;
    }
    match /contactos/{id} {
      allow read: if isOwner(resource.data.uid) || isAdmin();
      allow create: if request.resource.data.mensaje is string
        && request.resource.data.mensaje.size() > 0
        && request.resource.data.mensaje.size() <= 2000;
      allow update: if isAdmin();
      allow delete: if false;
    }
    // Reservas: crear solo el dueño validado; leer dueño o admin;
    // solo se puede pasar a 'cancelada' (dueño o admin); nunca borrar.
    match /reservas/{id} {
      allow read: if isOwner(resource.data.uid) || isAdmin();
      allow create: if isSignedIn()
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.hora in ['13:00','14:00','15:00','20:00','21:00','22:00']
        && request.resource.data.comensales >= 1
        && request.resource.data.comensales <= 10
        && request.resource.data.estado == 'activa';
      allow update: if (isOwner(resource.data.uid) || isAdmin())
        && request.resource.data.estado == 'cancelada';
      allow delete: if false;
    }
    // Aforo por slot: lectura pública (ver plazas); escritura validada
    // (las transacciones del cliente escriben como el usuario).
    match /aforo/{id} {
      allow read: if true;
      allow create, update: if isSignedIn()
        && request.resource.data.ocupadas >= 0
        && request.resource.data.limite >= 4
        && request.resource.data.limite <= 12;
      allow delete: if false;
    }
    // Reseñas de usuarios: lectura pública, crear logueado, likes logueado.
    match /resenas/{id} {
      allow read: if true;
      allow create: if isSignedIn()
        && request.resource.data.usuarioId == request.auth.uid;
      allow update: if isSignedIn();
      allow delete: if false;
    }
    // Allowlist de admins: cada uno solo lee su propio doc
    // (las reglas sí pueden consultarla con exists()).
    match /admins/{uid} {
      allow read: if isSignedIn() && request.auth.uid == uid;
      allow write: if false;
    }
  }
}
```

Además, en Authentication → Método de inicio de sesión, activa
**Correo electrónico/contraseña** (si no, el registro falla).

## Costes (plan Spark, gratis)

| Acción | Coste aprox. |
|---|---|
| Abrir la web | 21 lecturas (portada) + 1 count |
| Seguir deslizando | 21 lecturas por tanda |
| Filtrar / ordenar global | ~690 lecturas (1 vez, conjunto entero) |
| Filtrar / ordenar | 0 extra (todo en cliente tras cargar) |
| Crear cuenta / entrar | 0 en Firestore (perfil: 1 lectura por sesión) |
| Enviar contacto | 1 escritura |
| Favoritos | 0 lecturas (reutiliza cargados; 1 por guardado aún no visto) |
| Dieta y carta libro | 0 (todo determinista en cliente) |

Sin filtros se pagina de 21 en 21: una visita típica cuesta ~22 lecturas en
vez de ~690 (unas 2.000 visitas/día en cuota). Al activar cualquier filtro u
orden global se trae el conjunto entero una vez, como antes.

## Flujos para probar

- Sin filtros → "Mostrando 21 de 690 restaurantes"; al deslizar carga más.
- `sushi` + `€€` + zona Barcelona → trae el conjunto y filtra en cliente.
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
