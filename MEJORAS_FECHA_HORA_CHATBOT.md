# Mejoras en Fecha y Hora del Chatbot - Documentación

## Cambios Realizados

### 1. **Frontend - Utilidad de Formateo de Fechas**
**Archivo:** `frontend/src/app/shared/utils/date-formatter.util.ts`

Se creó una utilidad robusta para formatear fechas y horas de forma consistente en toda la aplicación:

```typescript
// Funciones principales disponibles:
- formatDateTime()      // Retorna fecha, hora y string completo
- formatTimeOnly()      // Solo la hora (HH:mm o HH:mm:ss)
- formatDateOnly()      // Solo la fecha
- formatDateRelative()  // Formato relativo (Hoy, Ayer, etc.)
- isToday()            // Verifica si es hoy
- isYesterday()        // Verifica si es ayer
```

**Características:**
- ✅ Maneja correctamente ISO 8601 strings y objetos Date
- ✅ Soporta zona horaria local del navegador
- ✅ Formato relativo automático (Hoy a las 14:30, Ayer a las 10:15)
- ✅ Formato completamente personalizable
- ✅ Locale: español de Colombia (es-CO)

### 2. **Frontend - Componente Assistant Page**
**Archivos:**
- `frontend/src/app/features/assistant/pages/assistant-page/assistant-page.component.ts`
- `frontend/src/app/features/assistant/pages/assistant-page/assistant-page.component.html`
- `frontend/src/app/features/assistant/pages/assistant-page/assistant-page.component.css`

**Cambios realizados:**

#### TypeScript (`component.ts`)
```typescript
// Nuevos métodos de formato
protected formatAskedAt(value: string): { date: string; time: string }
protected formatAskedAtRelative(value: string): string
```

#### HTML (`component.html`)
- Reorganizó la estructura de mensajes
- Añadió wrapper `bubble-wrapper` para agrupar mensaje + timestamp
- Timestamp ahora aparece debajo de cada mensaje (tanto usuario como IA)
- Añadido atributo `datetime` y `title` para mejor accesibilidad

**Antes:**
```html
<div class="bubble bubble--user">
  <p>{{ entry.question }}</p>
</div>
<time class="msg-time">{{ formatAskedAt(entry.askedAt) }}</time>
```

**Después:**
```html
<div class="bubble-wrapper">
  <div class="bubble bubble--user">
    <p>{{ entry.question }}</p>
  </div>
  <time class="msg-timestamp" [attr.datetime]="entry.askedAt" [title]="formatAskedAtRelative(entry.askedAt)">
    {{ formatAskedAtRelative(entry.askedAt) }}
  </time>
</div>
```

#### CSS (`component.css`)
- Nuevo selector `.bubble-wrapper` para agrupar mensaje + timestamp
- Actualizado `.msg-timestamp` con mejor visual
- Alineación adecuada para usuario (derecha) e IA (izquierda)
- Hover effect mejorado en timestamps

### 3. **Estructura Visual Mejorada**

#### Mensajes del Usuario
```
┌─ Tú
├─┌─ bubble-wrapper
│ ├─ [Mensaje de usuario]
│ └─ Hoy a las 14:30
```

#### Mensajes de la IA
```
┌─ ⭐️ (avatar)
├─┌─ bubble-wrapper
│ ├─ [Respuesta de IA]
│ ├─ [Pie de burbuja - fuente, botón reintentar]
│ └─ Hoy a las 14:31
```

## Recomendaciones para el Backend

### 1. **Configuración de Jackson para Serialización de Fechas**

Editar `ai-service/src/main/resources/application.yml`:

```yaml
spring:
  application:
    name: ai-service
  
  # Agregar esta sección para Jackson
  jackson:
    serialization:
      write-dates-as-timestamps: false
    default-property-inclusion: non_null
    time-zone: UTC
  
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc:
          time_zone: UTC
```

### 2. **Configuración de PostgreSQL**

Asegurar que PostgreSQL está configurado con zona horaria UTC:

```sql
-- Verificar zona horaria actual
SHOW timezone;

-- Establecer a UTC (si es necesario)
SET timezone = 'UTC';
```

### 3. **Bean de Configuración Opcional**

Para mayor control, crear una clase de configuración:

```java
@Configuration
public class JacksonConfig {
    
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.setTimeZone(TimeZone.getTimeZone("UTC"));
        return mapper;
    }
}
```

## Testing y Verificación

### 1. **Probar en el Navegador**

1. Abre DevTools (F12)
2. Consola → Verifica que los timestamps se ven correctamente
3. Comprueba que la zona horaria es la correcta para tu país

### 2. **API Response Test**

```bash
# Hacer petición a obtener conversación
curl -X GET http://localhost:8080/api/conversations/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# La respuesta debería tener createdAt en formato ISO 8601:
{
  "id": 1,
  "messages": [
    {
      "createdAt": "2026-05-18T14:30:00",
      ...
    }
  ]
}
```

### 3. **Verificar Zona Horaria en Navegador**

```javascript
// En la consola del navegador:
console.log(new Date().toString());
console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
```

## Formatos Disponibles

### Formato Relativo (Recomendado para UX)
```
Hoy a las 14:30
Ayer a las 10:15
dom, 18 may 2026 a las 14:30
```

### Formato Compacto
```
18/05/26 14:30
```

### Formato Completo
```
domingo, 18 de mayo de 2026 a las 14:30
```

## ⚠️ IMPORTANTE: Correcciones del Backend para Colombia

### Zona Horaria: America/Bogota (UTC-5)

Se han realizado cambios importantes en el backend para asegurar que **TODOS** los timestamps se generen en la zona horaria correcta de Colombia:

#### Archivos Modificados:

1. **`application.yml`** - Configuración de Jackson y Hibernate
   ```yaml
   spring:
     jackson:
       serialization:
         write-dates-as-timestamps: false
       time-zone: America/Bogota
     jpa:
       properties:
         hibernate:
           jdbc:
             time_zone: America/Bogota
   ```

2. **`util/DateTimeUtil.java`** - Nueva utilidad centralizada (✨ NUEVO)
   ```java
   public static LocalDateTime nowColombia() {
       return LocalDateTime.now(ZoneId.of("America/Bogota"));
   }
   ```

3. **`model/ConversationMessage.java`** - Usa DateTimeUtil
   ```java
   this.createdAt = DateTimeUtil.nowColombia();
   ```

4. **`model/Conversation.java`** - Usa DateTimeUtil
   ```java
   this.createdAt = DateTimeUtil.nowColombia();
   this.updatedAt = DateTimeUtil.nowColombia();
   ```

### ✅ Pasos para Aplicar (MUY IMPORTANTE)

1. **Reconstruye el proyecto:**
   ```bash
   cd ai-service
   mvn clean install
   ```

2. **Reinicia el servidor ai-service:**
   ```bash
   # Detener el servidor actual
   # Luego iniciar de nuevo
   mvn spring-boot:run
   ```

3. **Vacía el navegador (caché):**
   - DevTools (F12) → Application → Clear site data
   - O presiona: **Ctrl + Shift + Delete**

4. **Prueba el chatbot:**
   - Haz una nueva pregunta
   - Verifica que la hora mostrada coincida con tu reloj local

## Troubleshooting

### Problema: "La hora mostrada no es la actual"

**Posibles causas:**
1. Zona horaria del servidor vs. navegador está desalineada
2. LocalDateTime se serializa sin zona horaria
3. El navegador tiene zona horaria incorrecta
4. Caché del navegador mostrando datos viejos

**Solución:**
1. ✅ Implementar todas las configuraciones en `application.yml`
2. ✅ Actualizar modelos para usar `DateTimeUtil.nowColombia()`
3. ✅ Reconstruir y reiniciar el servidor (`mvn clean install`)
4. ✅ Limpiar caché del navegador (Ctrl + Shift + Delete)
5. Verificar zona horaria en PostgreSQL:
   ```sql
   SELECT NOW() AT TIME ZONE 'America/Bogota';
   ```

### Problema: "Timestamps inconsistentes entre usuario e IA"

**Solución:**
1. Ambos mensajes usan la misma utilidad `formatDateRelative()`
2. Verificar que el `createdAt` se setea al mismo tiempo en el backend
3. Revisar los logs del servidor para confirmar timestamps

## Notas de Desarrollo

- ✅ Compatible con Angular 17+
- ✅ Usa Signals de Angular (sin RxJS en esta utilidad)
- ✅ Locale-aware (puede ser fácilmente adaptado a otros idiomas)
- ✅ Validación de fechas inválidas
- ✅ Accesibilidad mejorada (atributos `datetime` y `title`)

## Archivo de Configuración Alternativo

Si prefieres trabajar con un `application.properties`:

```properties
# JSON serialization
spring.jackson.serialization.write-dates-as-timestamps=false
spring.jackson.default-property-inclusion=non_null
spring.jackson.time-zone=UTC

# JPA/Hibernate
spring.jpa.properties.hibernate.jdbc.time_zone=UTC

# Database
spring.datasource.hikari.initialization-fail-timeout=0
```

## Próximos Pasos Opcionales

1. **Agregar timestamp de "última lectura"** en conversaciones
2. **Mostrar duración** entre pregunta y respuesta
3. **Agrupar mensajes por fecha** si hay múltiples días
4. **Indicador de "escribiendo"** con timestamp en tiempo real
