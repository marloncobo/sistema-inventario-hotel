# Lunara Inventory Platform

Backend dockerizado para un sistema de inventario hotelero con marca propia, arquitectura en capas y microservicios sobre PostgreSQL.

## Qué entrega este repositorio

- `identity-service`: autenticación JWT, roles y usuarios.
- `masterdata-service`: áreas, bodegas, categorías, unidades, proveedores y productos.
- `inventory-service`: stock, movimientos, órdenes de compra, solicitudes internas, despachos, alertas, dashboard, auditoría y reportes.
- `docs/functional-analysis.md`: modelado del proceso, tabla de requisitos funcionales y entidades.
- `postman/lunara-inventory.postman_collection.json`: colección importable para Postman.
- `docker-compose.yml`: orquestación completa con PostgreSQL y los tres servicios.

## Arquitectura

Cada microservicio sigue la estructura:

- `controller`: expone endpoints REST.
- `service`: concentra reglas de negocio y orquestación.
- `repository`: acceso a datos con Spring Data JPA.
- `model`: entidades y enums del dominio.
- `resources`: configuración, esquema y datos semilla.

## Requisitos previos

- Docker Desktop o Docker Engine con el daemon activo.
- Puerto `5432`, `8081`, `8082` y `8083` disponibles.

## Ejecución

```bash
docker compose up --build
```

## Credenciales semilla

- `admin / Admin123!`
- `almacen / Warehouse123!`
- `solicitante / Requester123!`

## Flujo recomendado de uso

1. Hacer login en `identity-service` y copiar el JWT.
2. Crear o consultar catálogos en `masterdata-service`.
3. Registrar stock inicial en `inventory-service`.
4. Crear órdenes de compra o solicitudes internas.
5. Aprobar, recibir o despachar según el flujo operativo.
6. Consultar dashboard, alertas, auditoría y reportes.

## Resumen de endpoints

| Servicio | Puerto | Endpoint | Método | Descripción |
| --- | --- | --- | --- | --- |
| Identity | 8081 | `/api/auth/login` | `POST` | Inicia sesión y retorna JWT. |
| Identity | 8081 | `/api/roles` | `GET/POST` | Consulta o crea roles. |
| Identity | 8081 | `/api/users` | `GET/POST` | Consulta o crea usuarios. |
| Identity | 8081 | `/api/users/{id}/status` | `PATCH` | Activa o inactiva usuarios. |
| Master Data | 8082 | `/api/areas` | `GET/POST` | Consulta y crea áreas del hotel. |
| Master Data | 8082 | `/api/warehouses` | `GET/POST` | Consulta y crea bodegas. |
| Master Data | 8082 | `/api/categories` | `GET/POST` | Consulta y crea categorías. |
| Master Data | 8082 | `/api/units` | `GET/POST` | Consulta y crea unidades de medida. |
| Master Data | 8082 | `/api/suppliers` | `GET/POST` | Consulta y crea proveedores. |
| Master Data | 8082 | `/api/products` | `GET/POST` | Lista o registra productos. |
| Master Data | 8082 | `/api/products/{id}` | `PUT` | Actualiza productos. |
| Master Data | 8082 | `/api/products/{id}/deactivate` | `PATCH` | Inactiva productos. |
| Inventory | 8083 | `/api/stocks` | `GET` | Consulta inventario actual. |
| Inventory | 8083 | `/api/stocks/product/{productId}` | `GET` | Consulta stock por producto. |
| Inventory | 8083 | `/api/stocks/warehouse/{warehouseId}` | `GET` | Consulta stock por bodega. |
| Inventory | 8083 | `/api/stocks/initial` | `POST` | Registra stock inicial. |
| Inventory | 8083 | `/api/movements/manual-entry` | `POST` | Registra entradas manuales. |
| Inventory | 8083 | `/api/movements/manual-exit` | `POST` | Registra salidas manuales. |
| Inventory | 8083 | `/api/movements/history` | `GET` | Historial de movimientos. |
| Inventory | 8083 | `/api/movements/product/{productId}` | `GET` | Trazabilidad por producto. |
| Inventory | 8083 | `/api/purchase-orders` | `GET/POST` | Lista o crea órdenes de compra. |
| Inventory | 8083 | `/api/purchase-orders/{id}/approve` | `PATCH` | Aprueba una orden. |
| Inventory | 8083 | `/api/purchase-orders/{id}/receive` | `POST` | Registra recepción total o parcial. |
| Inventory | 8083 | `/api/internal-requests` | `GET/POST` | Lista o crea solicitudes internas. |
| Inventory | 8083 | `/api/internal-requests/{id}/approve` | `PATCH` | Aprueba o rechaza una solicitud. |
| Inventory | 8083 | `/api/internal-requests/{id}/dispatch` | `POST` | Despacha una solicitud aprobada. |
| Inventory | 8083 | `/api/internal-requests/consumption/product/{productId}` | `GET` | Consulta consumo por área. |
| Inventory | 8083 | `/api/alerts/low-stock` | `GET` | Lista productos bajo mínimo. |
| Inventory | 8083 | `/api/alerts/expirations` | `GET` | Lista productos próximos a vencer. |
| Inventory | 8083 | `/api/dashboard` | `GET` | Muestra indicadores resumidos. |
| Inventory | 8083 | `/api/audit` | `GET` | Consulta auditoría. |
| Inventory | 8083 | `/api/reports/current-inventory` | `GET` | Reporte de inventario actual. |
| Inventory | 8083 | `/api/reports/movements` | `GET` | Reporte de movimientos por fecha. |
| Inventory | 8083 | `/api/reports/low-stock` | `GET` | Reporte de stock crítico. |
| Inventory | 8083 | `/api/reports/current-inventory/export` | `GET` | Exporta inventario en CSV. |
| Inventory | 8083 | `/api/reports/movements/export` | `GET` | Exporta movimientos en CSV. |

## Ejemplos rápidos

### 1. Login

```http
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin123!"
}
```

### 2. Crear producto

```http
POST http://localhost:8082/api/products
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "code": "LENC-001",
  "name": "Toalla blanca",
  "description": "Toalla de baño para habitaciones",
  "categoryId": 2,
  "unitId": 1,
  "supplierId": 1,
  "minimumStock": 25,
  "maximumStock": 200,
  "averageCost": 15.90,
  "perishable": false,
  "lotControl": false,
  "expirationControl": false,
  "status": "ACTIVE"
}
```

### 3. Cargar stock inicial

```http
POST http://localhost:8083/api/stocks/initial
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "productId": 1,
  "productCode": "ASEO-001",
  "productName": "Detergente industrial",
  "warehouseId": 1,
  "warehouseName": "Bodega Central",
  "quantity": 20,
  "unitCost": 18.50,
  "minimumStock": 20,
  "maximumStock": 120,
  "lot": "LOT-2026-001",
  "expirationDate": "2026-12-31",
  "observations": "Carga inicial de apertura"
}
```

## Limitaciones y notas

- La validación final por compilación local no se pudo ejecutar en este entorno porque solo hay JRE y no JDK.
- La solución quedó preparada para compilar dentro de Docker mediante multi-stage build.
- La exportación implementada es en CSV, compatible con Excel y útil para cumplir el requisito de exportación operativa.
