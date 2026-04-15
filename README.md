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

### 1) `inventory-service`

Se encarga del inventario.

- crear insumos
- consultar insumos
- registrar entradas de stock
- reducir stock cuando se reparte a una habitacion
- listar movimientos
- listar insumos con stock bajo

### 2) `rooms-service`

Se encarga de las habitaciones y del historial de reparto.

- crear habitaciones
- consultar habitaciones
- asignar insumos a una habitacion
- consultar el historial de insumos entregados por habitacion
- consultar todas las asignaciones realizadas

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

Con Docker Compose se levantan dos contenedores PostgreSQL:

- `inventory-db`, expuesto en `localhost:5433`
- `rooms-db`, expuesto en `localhost:5434`

Credenciales locales por defecto:

```text
Usuario: hotel
Clave: hotel
```

Las tablas se crean/actualizan automaticamente con Spring Data JPA y Hibernate (`ddl-auto: update`).

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
```

Por defecto los servicios intentan conectarse a:

- Inventory: `jdbc:postgresql://localhost:5433/inventorydb`
- Rooms: `jdbc:postgresql://localhost:5434/roomsdb`

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

Primero genera los jars:

```bash
mvn clean package
docker compose up --build
```

## Puertos

- Gateway: `8080`
- Inventory: `8081`
- Rooms: `8082`
- PostgreSQL Inventory: `5433`
- PostgreSQL Rooms: `5434`

## Login y roles

El login se hace desde el gateway:

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Usuarios de prueba:

- `admin` / `admin123`: rol `ADMIN`, puede consultar y modificar.
- `usuario` / `user123`: rol `USER`, solo puede consultar con `GET`.

Usa el token recibido en las demas peticiones:

```text
Authorization: Bearer <token>
```

## Flujo sugerido de prueba

1. `GET /rooms/api/rooms`
2. `GET /inventory/api/inventory/items`
3. `POST /inventory/api/inventory/items` solo `ADMIN`
4. `POST /inventory/api/inventory/items/{id}/entries` solo `ADMIN`
5. `POST /rooms/api/rooms/{roomId}/supplies/assign` solo `ADMIN`
6. `GET /inventory/api/inventory/movements`
7. `GET /rooms/api/rooms/{roomId}/supplies`

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
- reportes
- auditoria avanzada
