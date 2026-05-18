# Títulos Automáticos para Conversaciones - Documentación

## 📋 Resumen Ejecutivo

Se ha implementado un sistema automático de generación de títulos para las conversaciones del chatbot, similar a **ChatGPT**. Los títulos se generan inteligentemente basándose en la primera pregunta del usuario.

---

## 🎯 Características Principales

### ✅ Generación Automática de Títulos
- Los títulos se generan **automáticamente** cuando se envía el primer mensaje
- No requiere intervención del usuario
- Se generan títulos **inteligentes y profesionales**

### ✅ Algoritmo Inteligente
El sistema implementa un algoritmo que:

1. **Detecta preguntas cortas** (≤ 50 caracteres)
   - Las devuelve tal cual, capitalizadas
   - Ejemplo: "¿Cuál es el stock de sábanas?" → "Cual es el stock de sábanas"

2. **Procesa preguntas largas** (> 50 caracteres)
   - Extrae las primeras palabras significativas (máximo 5)
   - Elimina palabras vacías (artículos, preposiciones cortas)
   - Añade "..." si se cortó
   - Ejemplo: "¿Cuál es el estado actual del inventario de sábanas blancas?" → "Cual es el estado actual del inventario..."

3. **Capitaliza automáticamente**
   - Primera letra mayúscula
   - Resto en minúsculas (a menos que sea una sigla)

4. **Limpia caracteres especiales**
   - Elimina signos de interrogación y exclamación
   - Mantiene espacios entre palabras

---

## 🔧 Implementación Técnica

### Archivo Modificado
**Ubicación:** `ai-service/src/main/java/com/hotel/ai/service/ConversationService.java`

### Métodos Nuevos

#### 1. `isGenericTitle(String title)`
```java
private boolean isGenericTitle(String title)
```
Detecta si el título es genérico (auto-generado inicialmente):
- "Nueva conversación"
- "New conversation"
- Vacío

#### 2. `generateTitleFromQuestion(String question)`
```java
private String generateTitleFromQuestion(String question)
```
Genera un título profesional basado en la pregunta:
- Máximo 50 caracteres por defecto
- Máximo 5 palabras significativas
- Añade "..." si se trunca

#### 3. `capitalizeFirstLetter(String text)`
```java
private String capitalizeFirstLetter(String text)
```
Capitaliza la primera letra de una cadena

### Flujo de Ejecución

```
Usuario envía pregunta
    ↓
Se crea ConversationMessage
    ↓
¿Es el primer mensaje?
    ├─ Sí → ¿Título es genérico?
    │         ├─ Sí → Generar título automático
    │         └─ No → Mantener título existente
    └─ No → No hacer cambios
    ↓
Guardar conversación con título
```

---

## 📝 Ejemplos de Funcionamiento

### Ejemplo 1: Pregunta Corta
**Pregunta:** "¿Cuál es el stock de toallas?"
**Título generado:** "Cual es el stock de toallas"

### Ejemplo 2: Pregunta Mediana
**Pregunta:** "Necesito conocer el consumo promedio de sábanas en los últimos 30 días"
**Título generado:** "Necesito conocer el consumo promedio de sábanas"

### Ejemplo 3: Pregunta Larga
**Pregunta:** "¿Cuál es el estado actual del inventario de todos los productos de limpieza disponibles en la bodega del hotel considerando los movimientos de los últimos 30 días?"
**Título generado:** "Cual es el estado actual del inventario..."

### Ejemplo 4: Pregunta con Signos Especiales
**Pregunta:** "¿¿¿Cuántas sábanas hay en stock???"
**Título generado:** "Cuantas sabanas hay en stock"

---

## 🎨 Beneficios de la Implementación

| Aspecto | Beneficio |
|--------|----------|
| **UX** | Los usuarios ven títulos significativos sin esfuerzo |
| **Profesionalismo** | Se parece a ChatGPT, una herramienta conocida y confiable |
| **Eficiencia** | No requiere que el usuario ingrese un título manualmente |
| **Escalabilidad** | El algoritmo maneja preguntas de cualquier longitud |
| **Legibilidad** | Los títulos son cortos y descriptivos |
| **Flexibilidad** | Permite títulos personalizados si el usuario lo desea |

---

## 🚀 Cómo Funciona en la Práctica

### Flujo en el Frontend (Angular)

1. **Usuario crea una conversación:**
   ```
   POST /ai/conversations
   Body: { title: "Nueva conversación" }
   Response: { id: 123, title: "Nueva conversación" }
   ```

2. **Usuario envía su primera pregunta:**
   ```
   POST /ai/inventory-assistant?conversationId=123
   Body: { question: "¿Cuál es el stock actual?" }
   ```

3. **Backend genera el título automáticamente:**
   - Recibe la pregunta
   - Detecta que es el primer mensaje
   - Detecta que el título es "Nueva conversación" (genérico)
   - Genera: "Cual es el stock actual"
   - Guarda la conversación con el nuevo título

4. **Frontend actualiza el historial:**
   - El título en la lista de conversaciones cambia
   - Sin necesidad de recargar
   - Sin intervención del usuario

---

## 🔒 Consideraciones de Seguridad

✅ **No se requiere API externa** - El título se genera localmente
✅ **No introduce dependencias externas** - Usa solo Java estándar
✅ **No afecta la privacidad** - El título es derivado de datos del usuario
✅ **Es predecible** - El usuario sabe qué se mostrará como título

---

## 📊 Casos de Uso

### Caso 1: Almacenista
- Pregunta: "¿Qué productos necesitan reabastecimiento urgente?"
- Título: "Que productos necesitan reabastecimiento urgente"

### Caso 2: Personal de Servicio
- Pregunta: "¿Cuántas sábanas blancas necesita la habitación 302?"
- Título: "Cuantas sabanas blancas necesita la habitación..."

### Caso 3: Recepcionista
- Pregunta: "¿Cuál es el estado de las habitaciones disponibles?"
- Título: "Cual es el estado de las habitaciones disponibles"

### Caso 4: Administrador
- Pregunta: "Dame un análisis completo del consumo de inventario por departamento en los últimos 30 días incluyendo proyecciones de demanda"
- Título: "Dame un analisis completo del consumo..."

---

## 🔄 Compatibilidad Hacia Atrás

✅ **No rompe funcionalidad existente**
- Las conversaciones existentes mantienen sus títulos
- El endpoint de actualización de títulos sigue funcionando
- Los usuarios pueden cambiar títulos manualmente si lo desean

---

## ⚙️ Configuración

No requiere configuración adicional. El sistema funciona automáticamente con valores por defecto:

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| Max caracteres | 50 | Longitud máxima del título |
| Max palabras | 5 | Máximo número de palabras a incluir |
| Min palabra | 2 | Caracteres mínimos para incluir palabra |

Para cambiar estos valores, edita los valores en `generateTitleFromQuestion()`.

---

## 📌 Próximos Pasos

1. **Compilar el proyecto:**
   ```bash
   mvn clean package
   ```

2. **Redeploy del servicio:**
   ```bash
   docker build -t ai-service:latest .
   docker push ai-service:latest
   ```

3. **Verificar en el frontend:**
   - Crea una nueva conversación
   - Envía una pregunta
   - Observa que el título cambie automáticamente

---

## ✅ Verificación

Para verificar que está funcionando correctamente:

1. **Abre el chatbot**
2. **Crea una nueva conversación** (verás "Nueva conversación")
3. **Envía tu primera pregunta**
4. **El título debería cambiar automáticamente** en la lista de conversaciones
5. **Prueba con diferentes preguntas:**
   - Cortas (< 50 caracteres)
   - Largas (> 100 caracteres)
   - Con signos especiales

---

## 🐛 Solución de Problemas

### El título no cambia después de enviar la pregunta
- ✅ Verifica que sea el **primer mensaje** de la conversación
- ✅ Verifica que el título inicial sea "Nueva conversación"
- ✅ Recarga la página para ver los cambios

### El título se ve truncado
- ✅ Esto es intencional para preguntas largas
- ✅ Se agrega "..." para indicar que fue truncado
- ✅ El usuario puede editar el título manualmente si lo desea

---

## 📚 Referencias

- **Archivo modificado:** `ConversationService.java`
- **Métodos nuevos:** 3 métodos privados
- **Líneas agregadas:** ~80 líneas
- **Complejidad:** O(n) donde n es el número de palabras en la pregunta

---

**Última actualización:** Mayo 18, 2026  
**Realizado por:** Claude AI Assistant
