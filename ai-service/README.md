# ai-service

`ai-service` es el microservicio Spring Boot encargado de consultar Gemini Developer API para responder preguntas sobre el inventario del hotel sin exponer la API key al frontend.

## Estado actual frente a tus requisitos

Antes de este cambio el proyecto **no** cumplia por completo con lo pedido:

- ya existia la carpeta `ai-service`
- pero usaba Ollama local en lugar de un proveedor cloud
- despues se adapto a OpenAI
- ahora queda migrado por completo a Gemini con API key

Con esta version el endpoint y el flujo funcional se mantienen, pero el proveedor de IA ahora es Gemini.

## Endpoint principal

`POST /api/ai/inventory-assistant`

Body minimo:

```json
{
  "question": "Que productos estan bajos de stock?"
}
```

Tambien puedes enviar contexto manual opcional:

```json
{
  "question": "Dame un resumen del inventario",
  "inventoryContext": {
    "items": [
      {
        "id": 1,
        "code": "INS-0001",
        "name": "Toallas",
        "category": "LENCERIA",
        "unit": "UND",
        "providerName": "Proveedor Demo",
        "stock": 8,
        "minStock": 10,
        "maxStock": 30,
        "active": true
      }
    ]
  }
}
```

Si `inventoryContext` no se envia, `ai-service` consulta `inventory-service`.

## Variables de entorno

```yaml
PORT=8085
INVENTORY_SERVICE_URL=http://localhost:8081
GEMINI_API_KEY=tu_api_key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com
GEMINI_MODEL=gemini-2.5-flash
JWT_SECRET=hotel-inventory-demo-secret-key-32
```

## Como funciona

1. Recibe la pregunta del usuario.
2. Obtiene items del inventario desde `inventory-service` o usa el contexto recibido.
3. Calcula un resumen operativo y una prioridad sugerida de reabastecimiento.
4. Construye un prompt claro y controlado.
5. Enriquece la consulta con productos, stock actual, stock minimo, categorias, movimientos recientes, consumo promedio, alertas, proveedores, areas, habitaciones, consumo/distribucion por habitaciones y usuarios/roles cuando esos datos estan disponibles para el usuario.
6. Llama a `POST /v1beta/models/{model}:generateContent` de Gemini.
7. Devuelve la respuesta de la IA.

## Que puede mirar la IA

Cuando no mandas `inventoryContext`, `ai-service` consulta `inventory-service`, `rooms-service` y `gateway-service` para obtener:

- productos
- stock actual
- stock minimo
- categorias
- movimientos recientes
- top usados
- consumo promedio de los ultimos 30 dias
- alertas de stock bajo
- proveedores
- areas del hotel
- habitaciones
- consumo por habitaciones
- distribucion por habitaciones
- usuarios
- roles
- conteos administrativos derivados del contexto visible

Algunos bloques dependen de los permisos del usuario autenticado. Por ejemplo, usuarios y roles solo estaran disponibles si el JWT tiene acceso administrativo a `gateway-service`. Si un bloque no esta disponible para ese rol, la IA sigue respondiendo con el contexto restante.

## Probar con Postman

### Opcion 1: directo al microservicio

1. Metodo: `POST`
2. URL: `http://localhost:8085/api/ai/inventory-assistant`
3. Header: `Content-Type: application/json`
4. Header: `Authorization: Bearer <tu_jwt>`
5. Body:

```json
{
  "question": "Que productos debo reabastecer primero?"
}
```

### Opcion 2: a traves del gateway

1. Metodo: `POST`
2. URL: `http://localhost:8080/ai/api/ai/inventory-assistant`
3. Header: `Content-Type: application/json`
4. Header: `Authorization: Bearer <tu_jwt>`
5. Body:

```json
{
  "question": "Dame un resumen del estado actual del inventario."
}
```

### Respuesta esperada

```json
{
  "answer": "Resumen y recomendaciones generadas por la IA",
  "contextSource": "inventory-service"
}
```

## Errores basicos

- `400 Bad Request`: `question` vacia o body invalido
- `503 Service Unavailable`: fallo al consultar `inventory-service` o Gemini
- `500 Internal Server Error`: `GEMINI_API_KEY` faltante o error inesperado

## Archivos clave

- `src/main/java/com/hotel/ai/controller/AiController.java`
- `src/main/java/com/hotel/ai/service/InventoryAssistantService.java`
- `src/main/java/com/hotel/ai/service/GeminiClient.java`
- `src/main/java/com/hotel/ai/client/RestClientInventoryClient.java`
- `src/main/java/com/hotel/ai/config/SecurityConfig.java`
- `src/main/resources/application.yml`
- `Dockerfile`
- `question-bank.json`

## Uso con Postman

Tambien tienes un archivo listo para Postman Runner en:

- `../postman/ai-question-bank.runner.json`
- `../postman/ai-question-bank.runner.csv`
- `../postman/AI-Question-Bank.postman_collection.json`

Cada objeto incluye:

- `category`
- `name`
- `question`

Puedes usarlo con un request del endpoint `POST /ai/api/ai/inventory-assistant` y body:

```json
{
  "question": "{{question}}"
}
```

Si Postman te rechaza el JSON como data file, usa el CSV, que es el formato mas compatible con Runner.

Si quieres importar algo directo desde la ventana `Import` de Postman, usa la coleccion:

- `AI-Question-Bank.postman_collection.json`
