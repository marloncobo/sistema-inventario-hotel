# ⏰ Instrucciones para Corregir la Hora del Chatbot

## Problema
La hora mostrada en el chatbot está **3 horas adelantada** (muestra 17:18 en lugar de 14:18).

## Causa
Los timestamps antiguos en la base de datos estaban guardados incorrectamente. Necesitamos:
1. Reconstruir el backend con los nuevos cambios
2. Limpiar los datos antiguos de la base de datos
3. Limpiar el caché del navegador

---

## 📋 Pasos a Seguir (EN ORDEN)

### **Paso 1: Reconstruir el Backend**

Abre una terminal en la carpeta del proyecto:

```bash
# Navega a la carpeta ai-service
cd ai-service

# Reconstruye el proyecto (compila todo de nuevo)
mvn clean install -DskipTests
```

**Espera a que termine** (puede tomar 1-2 minutos)

---

### **Paso 2: Limpiar la Base de Datos**

Abre **pgAdmin** o tu cliente de PostgreSQL y ejecuta el script:

**Archivo:** `LIMPIAR_TIMESTAMPS_ANTIGUOS.sql`

```sql
-- Eliminar todos los mensajes de conversación
DELETE FROM conversation_messages;

-- Eliminar todas las conversaciones
DELETE FROM conversations;

-- Verificar que está vacío
SELECT COUNT(*) FROM conversations;
SELECT COUNT(*) FROM conversation_messages;
```

**Nota:** Esto eliminará todo el historial del chatbot, pero es necesario para que los nuevos timestamps sean correctos.

---

### **Paso 3: Reiniciar el Servidor**

En la terminal anterior (carpeta `ai-service`):

```bash
# Si el servidor estaba corriendo, presiona Ctrl+C para detenerlo
# Luego ejecuta:
mvn spring-boot:run
```

**Espera** a ver el mensaje: `Started AiServiceApplication`

---

### **Paso 4: Limpiar Caché del Navegador**

En el navegador donde usa el chatbot:

1. Presiona: **`Ctrl + Shift + Delete`** (Windows/Linux)
   - O en Mac: **`Cmd + Shift + Delete`**

2. En la ventana que aparece:
   - Selecciona "Todos los tiempos"
   - ✅ Cookies y datos de sitios
   - ✅ Archivos almacenados en caché
   - Click en "Borrar datos"

3. **Recarga** la página: `Ctrl + F5` (recarga completa)

---

### **Paso 5: Prueba el Chatbot**

1. Abre el chatbot: http://localhost:4200 (o tu URL)
2. Haz una **nueva pregunta**
3. **Verifica la hora** mostrada en el mensaje

**Debería mostrar:**
```
Hoy a las 14:18    ← (o la hora actual real)
```

NO:
```
Hoy a las 17:18    ← (3 horas adelantada) ❌
```

---

## ✅ Cambios Realizados en el Backend

Se han actualizado estos archivos:

### 1. **application.yml**
```yaml
spring:
  jackson:
    time-zone: America/Bogota
  jpa:
    properties:
      hibernate:
        jdbc:
          time_zone: America/Bogota
```

### 2. **DateTimeUtil.java** (Nuevo)
```java
public static LocalDateTime nowColombia() {
    return LocalDateTime.now(ZoneId.of("America/Bogota"));
}
```

### 3. **ConversationMessage.java**
```java
this.createdAt = DateTimeUtil.nowColombia();
```

### 4. **Conversation.java**
```java
this.createdAt = DateTimeUtil.nowColombia();
this.updatedAt = DateTimeUtil.nowColombia();
```

### 5. **ConversationMessageDto.java** (Nuevo)
```java
@JsonFormat(
    shape = JsonFormat.Shape.STRING,
    pattern = "yyyy-MM-dd'T'HH:mm:ss",
    timezone = "America/Bogota"
)
LocalDateTime createdAt
```

### 6. **ConversationDto.java** (Nuevo)
- Same @JsonFormat annotation para `createdAt` y `updatedAt`

---

## 🔍 Verificar que Funciona

### En PostgreSQL:
```sql
-- Deberías ver la hora actual de Bogotá
SELECT NOW() AT TIME ZONE 'America/Bogota';
```

### En el Navegador (DevTools - F12):
```javascript
console.log(new Date().toString());
console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
```

---

## ⚠️ Si Sigue Sin Funcionar

Verifica:

1. **¿Ejecutaste `mvn clean install`?**
   - El servidor debe estar compilado con los nuevos cambios

2. **¿Limpiaste la base de datos?**
   - Los datos antiguos causarán problemas

3. **¿Limpiaste la caché del navegador?**
   - Los datos viejos pueden estar en memoria

4. **¿Reiniciaste el servidor?**
   - Presiona `Ctrl+C` y vuelve a ejecutar `mvn spring-boot:run`

5. **Verifica los logs del servidor:**
   - Busca errores o warnings sobre "timezone"

---

## 📞 Soporte

Si sigue sin funcionar, verifica:

- Zona horaria del SO: Settings → Fecha y Hora → Zona horaria debe ser "Bogotá"
- PostgreSQL: `SHOW timezone;` debería mostrar algo como `UTC`
- Logs del servidor en consola

---

## ✨ Resultado Final

Cuando funcione correctamente, verás:

```
👤 Tú
  └─ ¿Cuál es el inventario?
     Hoy a las 14:18

⭐️ Asistente IA
  └─ El inventario actual es...
     [Fuente] [Reintentar]
     Hoy a las 14:19
```

¡Listo! 🎉
