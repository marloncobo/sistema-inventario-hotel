# Hotel Inventory Microservices

Proyecto base en **Java + Spring Boot** para un hotel que necesita controlar:

- ingreso de insumos al inventario
- consulta de existencias
- alertas de stock minimo
- registro de habitaciones
- reparto de insumos por habitacion
- trazabilidad de movimientos
- exposicion centralizada de endpoints mediante **API Gateway**

## Arquitectura

El proyecto esta dividido en 3 microservicios:

Cada microservicio mantiene arquitectura en capas:

- `controller`: expone endpoints REST y valida contratos de entrada.
- `service`: concentra reglas de negocio y transacciones.
- `repository`: acceso a datos con Spring Data JPA.
- `model`: entidades persistentes.
- `dto`: contratos de entrada/salida entre clientes y servicios.
- `config`: seguridad, carga inicial y clientes HTTP.

### 1) `inventory-service`

Se encarga del inventario.

- crear insumos
- editar e inactivar insumos
- consultar insumos
- filtrar insumos por categoria
- registrar entradas de stock
- registrar salidas unificadas por origen: `HABITACION`, `VENTA`, `CONSUMO_INTERNO`, `MERMA`
- registrar devoluciones
- listar movimientos con filtros basicos
- listar insumos con stock bajo
- validar codigo/nombre unico, stock minimo/maximo, insumos activos y stock no negativo

### 2) `rooms-service`

Se encarga de las habitaciones y del historial de reparto.

- crear habitaciones
- actualizar estado operativo de habitaciones
- consultar habitaciones
- asignar insumos a una habitacion para minibar, kit de aseo o servicio a la habitacion
- consultar el historial de insumos entregados por habitacion
- consultar todas las asignaciones realizadas
- generar auditoria de cambios de habitaciones y entregas

El negocio queda configurado para un hotel de 45 habitaciones; si ya existen 45 habitaciones, el backend bloquea nuevos registros.

### 3) `gateway-service`

API Gateway de entrada.

Rutas configuradas:

- `/inventory/**` -> `inventory-service`
- `/rooms/**` -> `rooms-service`

## Tecnologias usadas

- Java 21
- Spring Boot 3.5.13
- Spring Cloud 2025.0.1
- Spring Web / WebFlux Gateway
- Spring Data JPA
- PostgreSQL 16
- Docker / Docker Compose

## Base de datos

El proyecto usa **PostgreSQL 16** como base de datos persistente.

Cada microservicio con datos tiene su propia base de datos:

- `inventory-service` usa `inventorydb`
- `rooms-service` usa `roomsdb`
- `gateway-service` usa `gatewaydb` para usuarios y roles persistentes

Con Docker Compose se levantan tres contenedores PostgreSQL:

- `inventory-db`, expuesto en `localhost:5433`
- `rooms-db`, expuesto en `localhost:5434`
- `gateway-db`, expuesto en `localhost:5435`

Credenciales locales por defecto:

```text
Usuario: hotel
Clave: hotel
```

Las tablas se crean/actualizan automaticamente con Spring Data JPA y Hibernate (`ddl-auto: update`).

> El script de `documentos/hotel_brisas_inventario.sql` describe un modelo MySQL monolitico de referencia. Este backend lo traduce a microservicios con bases separadas: inventario conserva insumos y movimientos; habitaciones conserva habitaciones y entregas por habitacion.

## Como ejecutar

### Sin Docker

Requisitos:

- Java 21
- Maven 3.9+
- PostgreSQL 16

Antes de ejecutar sin Docker, crea estas bases de datos en PostgreSQL:

```sql
CREATE DATABASE inventorydb;
CREATE DATABASE roomsdb;
CREATE DATABASE gatewaydb;
```

Por defecto los servicios intentan conectarse a:

- Inventory: `jdbc:postgresql://localhost:5433/inventorydb`
- Rooms: `jdbc:postgresql://localhost:5434/roomsdb`
- Gateway: `jdbc:postgresql://localhost:5435/gatewaydb`

Puedes cambiar la conexion con variables de entorno:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/inventorydb
SPRING_DATASOURCE_USERNAME=hotel
SPRING_DATASOURCE_PASSWORD=hotel
```

```bash
mvn clean package
mvn -pl inventory-service spring-boot:run
mvn -pl rooms-service spring-boot:run
mvn -pl gateway-service spring-boot:run
```

### Con Docker

Requisitos:

- Docker
- Docker Compose v2

Levanta todo el entorno desde la raiz del proyecto:

```bash
docker compose up --build
```

Esto construye los tres microservicios, crea las tres bases PostgreSQL y espera a que los contenedores esten saludables antes de iniciar los servicios dependientes.

Para ejecutarlo en segundo plano:

```bash
docker compose up --build -d
```

Verifica el estado:

```bash
docker compose ps
```

Consulta logs:

```bash
docker compose logs -f gateway-service
```

Deten el entorno sin borrar datos:

```bash
docker compose down
```

Deten el entorno y borra los volumenes de PostgreSQL:

```bash
docker compose down -v
```

Cada Dockerfile compila su propio JAR en una etapa Maven y luego ejecuta el servicio sobre una imagen JRE con usuario no root y healthcheck por Actuator.

El `JWT_SECRET` se comparte entre servicios desde Docker Compose. Para cambiarlo:

```bash
JWT_SECRET=una-clave-larga-y-segura docker compose up --build
```

## Puertos

- Gateway: `8080`
- Inventory: `8081`
- Rooms: `8082`
- PostgreSQL Inventory: `5433`
- PostgreSQL Rooms: `5434`
- PostgreSQL Gateway: `5435`

## Login y roles

El login se hace desde el gateway:

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123"}'
```

Usuarios de prueba:

- `admin` / `Admin123`: rol `ADMIN`, puede consultar y modificar.
- `almacen` / `Almacen123`: rol `ALMACENISTA`, gestiona inventario y proveedores.
- `recepcion` / `Recepcion123`: rol `RECEPCION`, gestiona habitaciones.
- `servicio` / `Servicio123`: rol `SERVICIO`, registra entregas operativas a habitaciones.

Los usuarios se guardan en base de datos desde el gateway y pueden administrarse con rol `ADMIN` en `/auth/users`.
Los catalogos generales, bitacoras de auditoria y reportes globales de inventario quedan restringidos a `ADMIN`; proveedores tambien puede gestionarlos `ALMACENISTA`. Los reportes de habitaciones pueden consultarlos `ADMIN` y `RECEPCION`.

Usa el token recibido en las demas peticiones:

```text
Authorization: Bearer <token>
```

## Flujo sugerido de prueba

1. `GET /rooms/api/rooms`
2. `GET /inventory/api/inventory/items`
3. `POST /inventory/api/inventory/items` con `ADMIN` o `ALMACENISTA`
4. `POST /inventory/api/inventory/items/{id}/entries` con `ADMIN` o `ALMACENISTA`
5. `POST /rooms/api/rooms/{roomId}/supplies/assign` con `ADMIN`, `ALMACENISTA` o `SERVICIO`
6. `GET /inventory/api/inventory/movements`
7. `GET /rooms/api/rooms/{roomId}/supplies`

## Endpoints principales

Inventory:

- `GET /inventory/api/inventory/catalogs/categories`
- `POST /inventory/api/inventory/catalogs/categories`
- `GET /inventory/api/inventory/catalogs/units`
- `POST /inventory/api/inventory/catalogs/units`
- `GET /inventory/api/inventory/catalogs/providers`
- `POST /inventory/api/inventory/catalogs/providers`
- `GET /inventory/api/inventory/catalogs/areas`
- `POST /inventory/api/inventory/catalogs/areas`
- `POST /inventory/api/inventory/items`
- `GET /inventory/api/inventory/items?category=ASEO`
- `GET /inventory/api/inventory/items/{id}`
- `PUT /inventory/api/inventory/items/{id}`
- `PATCH /inventory/api/inventory/items/{id}/deactivate`
- `POST /inventory/api/inventory/items/{id}/entries`
- `POST /inventory/api/inventory/items/{id}/returns`
- `POST /inventory/api/inventory/internal/items/decrease`
- `GET /inventory/api/inventory/items/low-stock`
- `GET /inventory/api/inventory/alerts/low-stock`
- `GET /inventory/api/inventory/movements?type=SALIDA&origin=HABITACION&roomNumber=101&operationalResponsible=Camila&startDate=2026-04-01&endDate=2026-04-30`
- `POST /inventory/api/inventory/movements/{id}/void`
- `GET /inventory/api/inventory/reports/inventory`
- `GET /inventory/api/inventory/reports/top-used`
- `GET /inventory/api/inventory/reports/inventory/export?format=xlsx`
- `GET /inventory/api/inventory/reports/inventory/export?format=pdf`
- `GET /inventory/api/inventory/reports/top-used/export?format=xlsx`
- `GET /inventory/api/inventory/reports/top-used/export?format=pdf`
- `GET /inventory/api/inventory/audit?action=STOCK_EXIT&username=almacen&startDate=2026-04-01&endDate=2026-04-30`

Rooms:

- `POST /rooms/api/rooms`
- `GET /rooms/api/rooms`
- `GET /rooms/api/rooms/{id}`
- `PATCH /rooms/api/rooms/{id}/status`
- `POST /rooms/api/rooms/{roomId}/supplies/assign`
- `GET /rooms/api/rooms/{roomId}/supplies`
- `GET /rooms/api/rooms/supplies?roomNumber=101&assignmentType=MINIBAR&startDate=2026-04-01&endDate=2026-04-30`
- `GET /rooms/api/rooms/reports/consumption?roomType=ESTANDAR&assignmentType=MINIBAR`
- `GET /rooms/api/rooms/reports/consumption/export?format=xlsx&roomType=ESTANDAR`
- `GET /rooms/api/rooms/reports/consumption/export?format=pdf&roomType=ESTANDAR`
- `GET /rooms/api/rooms/reports/distribution?roomType=ESTANDAR&deliveredBy=Camila`
- `GET /rooms/api/rooms/reports/distribution/export?format=xlsx&roomType=ESTANDAR`
- `GET /rooms/api/rooms/reports/distribution/export?format=pdf&roomType=ESTANDAR`
- `GET /rooms/api/rooms/audit?action=ASSIGN_SUPPLY&username=servicio&startDate=2026-04-01&endDate=2026-04-30`

Gateway:

- `GET /auth/users`
- `POST /auth/users`
- `PUT /auth/users/{id}`
- `GET /auth/audit?action=LOGIN_SUCCESS&username=admin&startDate=2026-04-01&endDate=2026-04-30`

## Conexion a PostgreSQL

Inventory:

```bash
psql -h localhost -p 5433 -U hotel -d inventorydb
```

Rooms:

```bash
psql -h localhost -p 5434 -U hotel -d roomsdb
```

## Postman

Importa:

- `postman/Hotel-Inventory-Microservices.postman_collection.json`

Variable incluida:

- `baseUrl = http://localhost:8080`

## Que hace cada carpeta

- `inventory-service/`: logica de inventario y movimientos
- `rooms-service/`: habitaciones y reparto de insumos
- `gateway-service/`: punto unico de entrada
- `postman/`: coleccion lista para pruebas
- `docker-compose.yml`: arranque conjunto con Docker y PostgreSQL

## Mejoras futuras

- Config Server / Eureka
- dashboard operativo
