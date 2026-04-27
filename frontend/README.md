# Hotel Inventory Hub Frontend

Frontend Angular para el sistema de inventario hotelero. Este proyecto consume unicamente el API Gateway existente en `http://localhost:8080` y no requiere cambios en el backend.

## Requisitos

- Node.js 22+
- npm 10+
- API Gateway disponible en `http://localhost:8080`

## Desarrollo

```bash
npm install
npm start
```

La aplicacion queda disponible en `http://localhost:4200`.

## Build de produccion

```bash
npm run build:prod
```

Salida generada en `dist/frontend/browser`.

## Despliegue con contenedor

```bash
docker build -t hotel-inventory-frontend .
docker run --rm -p 4200:80 hotel-inventory-frontend
```

El contenedor usa `nginx.conf` con fallback para SPA y cache agresivo para assets versionados.

## Roles de prueba

- `admin / Admin123`
- `almacen / Almacen123`
- `recepcion / Recepcion123`
- `servicio / Servicio123`

## Restricciones del backend respetadas por el frontend

- El JWT se envia como `Authorization: Bearer <token>`.
- El frontend consume solo `/auth/**`, `/inventory/**` y `/rooms/**` por el gateway.
- `SERVICIO` puede asignar insumos, pero requiere `roomId` manual porque el backend no resuelve ese dato desde el numero de habitacion.
- La salida interna de inventario no usa `origin=HABITACION`; para ese caso se usa el flujo de asignaciones del servicio de habitaciones.
- La exportacion de reportes de habitaciones se mantiene restringida a `ADMIN`.
