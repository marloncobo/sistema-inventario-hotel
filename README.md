# Hotel Inventory Microservices

Proyecto base en **Java + Spring Boot** para un hotel que necesita controlar:

- ingreso de insumos al inventario
- consulta de existencias
- alertas de stock mínimo
- registro de habitaciones
- reparto de insumos por habitación
- trazabilidad de movimientos
- exposición centralizada de endpoints mediante **API Gateway**

## Arquitectura

El proyecto está dividido en 3 microservicios:

### 1) `inventory-service`
Se encarga del inventario.
- crear insumos
- consultar insumos
- registrar entradas de stock
- reducir stock cuando se reparte a una habitación
- listar movimientos
- listar insumos con stock bajo

### 2) `rooms-service`
Se encarga de las habitaciones y del historial de reparto.
- crear habitaciones
- consultar habitaciones
- asignar insumos a una habitación
- consultar el historial de insumos entregados por habitación
- consultar todas las asignaciones realizadas

### 3) `gateway-service`
API Gateway de entrada.

Rutas configuradas:
- `/inventory/**` → `inventory-service`
- `/rooms/**` → `rooms-service`

## Tecnologías usadas
- Java 21
- Spring Boot 3.5.13
- Spring Cloud 2025.0.1
- Spring Web / WebFlux Gateway
- Spring Data JPA
- H2 Database
- Docker / Docker Compose

## Cómo ejecutar

### Sin Docker
Requisitos:
- Java 21
- Maven 3.9+

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

## H2 Console
- Inventory: `http://localhost:8081/h2-console`
  - JDBC: `jdbc:h2:mem:inventorydb`
- Rooms: `http://localhost:8082/h2-console`
  - JDBC: `jdbc:h2:mem:roomsdb`

Usuario: `sa`
Clave: `password`

## Postman
Importa:
- `postman/Hotel-Inventory-Microservices.postman_collection.json`

Variable incluida:
- `baseUrl = http://localhost:8080`

## Qué hace cada carpeta
- `inventory-service/`: lógica de inventario y movimientos
- `rooms-service/`: habitaciones y reparto de insumos
- `gateway-service/`: punto único de entrada
- `postman/`: colección lista para pruebas
- `docker-compose.yml`: arranque conjunto con Docker

## Mejoras futuras
- JWT y roles
- PostgreSQL/MySQL
- Config Server / Eureka
- reportes
- auditoría avanzada
