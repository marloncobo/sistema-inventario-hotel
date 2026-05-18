# Problemas Encontrados y Solucionados - Chat IA

## Resumen de Errores 503

El error **503 (Service Unavailable)** se debía a **TRES problemas principales** en la configuración de rutas y seguridad:

---

## ✅ Problema 1: Context Path Duplicado en AI Service

### El Problema
- **Archivo**: `ai-service/src/main/resources/application.yml`
- **Línea**: `server.servlet.context-path: /api`
- **Efecto**: Las rutas se duplicaban: `/api/ai/inventory-assistant` en lugar de `/ai/inventory-assistant`

### La Solución
Removimos el context-path del application.yml:

```yaml
# ANTES:
server:
  port: 8080
  servlet:
    context-path: /api  ❌ ESTO CAUSA EL CONFLICTO

# DESPUÉS:
server:
  port: 8080            ✅ CORRECTO
```

**Resultado**: Las rutas ahora se sirven directamente en `/ai/...`

---

## ✅ Problema 2: Rutas Incorrectas en AI Service SecurityConfig

### El Problema
- **Archivo**: `ai-service/src/main/java/com/hotel/ai/config/SecurityConfig.java`
- **Línea 32**: `requestMatchers(HttpMethod.POST, "/api/ai/inventory-assistant")`
- **Efecto**: La configuración de seguridad buscaba una ruta que no existía

### La Solución
Cambiamos la ruta para que coincida con el endpoint real:

```java
// ANTES:
.requestMatchers(HttpMethod.POST, "/api/ai/inventory-assistant").hasAnyRole(...)  ❌

// DESPUÉS:
.requestMatchers("/ai/**").hasAnyRole("ADMIN", "ALMACENISTA", "SERVICIO", "RECEPCION")  ✅
```

**Resultado**: Todas las rutas `/ai/**` están protegidas por RBAC correctamente

---

## ✅ Problema 3: Rutas Incorrectas en Gateway SecurityConfig

### El Problema
- **Archivo**: `gateway-service/src/main/java/com/hotel/gateway/config/SecurityConfig.java`
- **Línea 43**: `pathMatchers(HttpMethod.POST, "/ai/api/ai/inventory-assistant")`
- **Efecto**: Ruta duplicada y malformada que nunca coincidía

### La Solución
Consolidamos las rutas de AI en una sola línea:

```java
// ANTES (Línea 43):
.pathMatchers(HttpMethod.POST, "/ai/api/ai/inventory-assistant").hasAnyRole(...)  ❌

// DESPUÉS:
.pathMatchers("/ai/**").hasAnyRole("ADMIN", "ALMACENISTA", "SERVICIO", "RECEPCION")  ✅
```

**Resultado**: El gateway ahora rutea correctamente al ai-service

---

## 🔄 Flujo de Funcionamiento (CORRECTO)

```
Cliente (localhost:4200)
    ↓
Frontend hace request a: http://localhost:8080/ai/inventory-assistant
    ↓
Gateway (puerto 8080) recibe
    ↓
SecurityConfig valida JWT ✅
    ↓
Reenvía a: http://ai-service:8080/ai/inventory-assistant (dentro de Docker)
    ↓
AI Service recibe en puerto 8080
    ↓
SecurityConfig valida JWT nuevamente ✅
    ↓
AiController @RequestMapping("/ai") procesa la request
    ↓
Responde con InventoryAssistantResponse ✅
```

---

## 📋 Archivos Modificados

1. ✅ `ai-service/src/main/resources/application.yml`
   - Removido: `server.servlet.context-path: /api`

2. ✅ `ai-service/src/main/java/com/hotel/ai/config/SecurityConfig.java`
   - Cambió: `/api/ai/inventory-assistant` → `/ai/**`

3. ✅ `gateway-service/src/main/java/com/hotel/gateway/config/SecurityConfig.java`
   - Cambió: `/ai/api/ai/inventory-assistant` → `/ai/**`

4. ✅ `docker-compose.yml`
   - Cambió healthcheck: `/api/actuator/health` → `/actuator/health`

---

## 🚀 Pasos para Probar

### 1. Reconstruir los contenedores

```bash
cd C:\Users\MI PC\Desktop\Programacion2\sistema-inventario-hotel
docker compose down -v
docker compose up --build
```

Espera hasta que veas:
```
gateway-service | Started GatewayServiceApplication in X seconds
ai-service | Started AiServiceApplication in X seconds
```

### 2. Obtener un token JWT

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123"}'
```

Respuesta esperada:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresAt": "2026-05-18T01:58:56Z",
  "username": "admin",
  "roles": ["ADMIN"]
}
```

### 3. Probar el endpoint directamente

```bash
curl -X POST http://localhost:8080/ai/inventory-assistant?conversationId=1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PEGA_EL_TOKEN_AQUI" \
  -d '{"question":"¿Cuántas almohadas hay?"}'
```

Debería devolver:
```json
{
  "answer": "...",
  "sources": [...],
  "context": {...}
}
```

### 4. Probar desde el navegador

1. Abre `http://localhost:4200` en el navegador
2. Si te pide login, usa: `admin` / `Admin123`
3. Ve al chat de IA
4. Haz una pregunta
5. Verifica en DevTools (F12) → Network que la request sea **200 OK**

---

## ✨ Clave del Problema

El issue principal era **rutas inconsistentes**:
- Cliente: `/ai/inventory-assistant` ✓
- Gateway expected: `/ai/api/ai/inventory-assistant` ✗
- AI Service served: `/api/ai/inventory-assistant` ✗

Ahora todos coinciden: `/ai/**` en todos lados ✅

---

## 📞 Si aún hay problemas

Ejecuta estos comandos para diagnosticar:

```bash
# Ver logs en tiempo real
docker logs gateway-service -f
docker logs ai-service -f

# Ver estado de contenedores
docker compose ps

# Probar connectividad interna de Docker
docker exec gateway-service curl -v http://ai-service:8080/actuator/health
```

