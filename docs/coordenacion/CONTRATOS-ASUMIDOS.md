# Contratos asumidos (PC 4)

Acuerdos provisionales que usa **Marco (PC 4)** mientras PC 1 (Izan) no publica el contrato en la bóveda (`Proyecto/Contratos API.md`). Se avisa en `HILO-PC3-PC4.md` al crearlos y se ajusta todo a la forma real en cuanto salga el contrato oficial.

## G10 · Validación de visita por QR (fase 3, pendiente de PC 1)

### POST /v1/ofertas/visitas/validar  (auth: empresa dueña o admin)

Petición:

```json
{ "codigo": "MIRA.<base64url>.<firma>" }
```

Respuesta 200:

```json
{
  "estado": "ok",
  "visitaId": "vis123",
  "oferta": {
    "titulo": "Menú de mediodía",
    "nivel": { "distancia": 20, "texto": "20 % + postre gratis", "descuentoPct": 20 }
  }
}
```

Errores (formato estándar del contrato de ofertas: `{ error, message? }`):

| Estado | `error` | Cuándo |
|---|---|---|
| 400 | `CODIGO_INVALIDO` | estructura o firma del código no válidas |
| 403 | `OTRO_RESTAURANTE` | el código es válido pero de otro restaurante |
| 404 | `NOT_FOUND` | la visita no existe |
| 409 | `YA_USADO` | la visita ya se validó |
| 410 | `CADUCADO` | el QR ha superado su caducidad |

### GET /v1/ofertas/visitas?restauranteId=1&fecha=AAAA-MM-DD  (auth: empresa dueña o admin)

Lista de llegadas del día (solo eventos sueltos, nunca recorridos).

Respuesta 200:

```json
{ "data": [ { "visitaId": "vis123", "hora": "2026-10-15T13:24:00.000Z", "titulo": "Menú de mediodía", "descuentoPct": 20, "estado": "validada" } ] }
```

Hasta que exista, el escáner trabaja con un mock local documentado en `HILO-PC3-PC4.md`: el componente expone `onValidar(codigo)` y quien lo monte decide la fuente.

## G07 · Estadísticas de ofertas (fase 2, pendiente de PC 1)

### GET /v1/ofertas/estadisticas?restauranteId=1&desde=AAAA-MM-DD&hasta=AAAA-MM-DD  (auth: empresa dueña o admin)

Contadores agregados, **sin datos de ubicación**:

```json
{
  "porNivel": [ { "distancia": 1000, "avisos": 42, "llegadas": 0 }, { "distancia": 500, "avisos": 30, "llegadas": 0 }, { "distancia": 100, "avisos": 18, "llegadas": 0 }, { "distancia": 20, "avisos": 5, "llegadas": 4 } ],
  "porFecha": [ { "fecha": "2026-10-13", "avisos": 12, "llegadas": 2 }, { "fecha": "2026-10-14", "avisos": 17, "llegadas": 3 } ]
}
```

`llegadas` solo se llena desde la fase 3. Mientras tanto, `OfertasStats` consume datos simulados con esta misma forma.