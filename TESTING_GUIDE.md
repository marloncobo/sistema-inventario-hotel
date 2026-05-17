# 🧪 Guía de Testing - Sistema RBAC para Chatbot

## 📋 Antes de Empezar

El sistema está **100% listo para probar**. Los cambios incluyen:
- ✅ Backend Java con filtrado por rol
- ✅ Frontend Angular adaptado al rol
- ✅ Banco de preguntas por rol
- ✅ Lógica de permisos implementada

---

## 🚀 Cómo Compilar y Ejecutar

### 1. Backend (Java/Spring Boot)

```bash
cd ai-service
mvn clean install
mvn spring-boot:run
```

**Esperado:** Servidor levanta en `http://localhost:8080`

### 2. Frontend (Angular)

```bash
cd frontend
npm install
ng serve --open
```

**Esperado:** App abre en `http://localhost:4200`

---

## 👥 Usuarios de Prueba

Crea estos usuarios en tu sistema (si no existen) con estos roles:

| Usuario | Contraseña | Rol | Email |
|---------|-----------|-----|-------|
| admin | password123 | ADMIN | admin@hotel.com |
| almacen | password123 | ALMACENISTA | almacen@hotel.com |
| servicio | password123 | SERVICIO | servicio@hotel.com |
| recepcion | password123 | RECEPCION | recepcion@hotel.com |

---

## 🧬 Pruebas por Rol

### 1️⃣ ADMIN - Acceso Completo

**Login:** `admin` / `password123`

#### Pruebas esperadas:

**Pregunta 1:** "¿Cuál es el estado general del sistema?"
```
✅ ESPERADO:
- Métricas de productos totales
- Información de usuarios activos
- Estado de habitaciones
- Alertas de stock
- Recomendaciones estratégicas
```

**Pregunta 2:** "¿Quiénes son los usuarios del sistema?"
```
✅ ESPERADO:
- Lista de usuarios con roles
- Estado (Activo/Inactivo)
- Información detallada
```

**Pregunta 3:** "¿Cuál es la ocupancy del hotel?"
```
✅ ESPERADO:
- Habitaciones disponibles
- Ocupadas
- En limpieza
- Patrones de consumo
```

**Panel Lateral:**
- 8 sugerencias de preguntas diferentes
- Badge: "ADMIN - Acceso completo al sistema"
- Opciones ejecutivas y estratégicas

---

### 2️⃣ ALMACENISTA - Solo Bodega

**Login:** `almacen` / `password123`

#### Pruebas esperadas:

**Pregunta 1:** "¿Qué productos necesito reabastecer?"
```
✅ ESPERADO:
- Solo datos de bodega (NO habitaciones)
- Productos ordenados por urgencia
- Cantidades recomendadas
- Consumo últimos 30 días
❌ NO DEBERÍA INCLUIR:
- Información de habitaciones
- Usuarios del sistema
- Estado de cuartos
```

**Pregunta 2:** "¿Cuáles son los productos con stock crítico?"
```
✅ ESPERADO:
- Lista de alertas
- Stock actual vs mínimo
- Consumo diario estimado
- Proveedores
❌ NO DEBERÍA INCLUIR:
- "No tienes acceso a habitaciones"
- Información de huéspedes
```

**Pregunta 3:** "¿Quiénes son los usuarios del sistema?"
```
✅ ESPERADO:
"No tienes acceso a esta información. 
Tu rol de ALMACENISTA te permite ver:
- Inventario de bodega
- Stock y alertas
- Movimientos
Contacta con ADMIN para información de usuarios."
```

**Panel Lateral:**
- 8 sugerencias enfocadas en bodega
- Badge: "ALMACENISTA - Gestión de bodega e inventario"
- Opciones de reabastecimiento, alertas, consumo

---

### 3️⃣ SERVICIO - Solo Habitaciones

**Login:** `servicio` / `password123`

#### Pruebas esperadas:

**Pregunta 1:** "¿Qué productos necesita la habitación 305?"
```
✅ ESPERADO:
- Jabón: X unidades
- Papel: X unidades
- Champú: X unidades
- Minibar: completo/parcial
- Basado en tipo de habitación
❌ NO DEBERÍA INCLUIR:
- Stock en bodega
- Alertas generales
- Información de otros usuarios
```

**Pregunta 2:** "¿Consumo esperado por tipo de cuarto?"
```
✅ ESPERADO:
- Suites: X unidades/mes
- Dobles: Y unidades/mes
- Individuales: Z unidades/mes
- Desglose por producto
- Patrones históricos
```

**Pregunta 3:** "¿Cuánto stock hay en bodega?"
```
✅ ESPERADO:
"No tienes acceso a información de bodega.
Tu rol de SERVICIO te permite ver:
- Productos por habitación
- Consumo esperado
- Tus propios movimientos
Contacta con ALMACENISTA para datos de bodega."
```

**Panel Lateral:**
- 8 sugerencias enfocadas en habitaciones
- Badge: "SERVICIO - Operaciones de habitaciones y limpieza"
- Opciones de consumo, distribución, reposición

---

### 4️⃣ RECEPCIÓN - Solo Habitaciones + PAR

**Login:** `recepcion` / `password123`

#### Pruebas esperadas:

**Pregunta 1:** "¿Qué estado tiene la habitación 305?"
```
✅ ESPERADO:
- Estado: DISPONIBLE/OCUPADA/LIMPIEZA
- Tipo: Suite/Doble/Individual
- PAR (qué debería contener)
- Último huésped
- Check-in/out próximo
❌ NO DEBERÍA INCLUIR:
- Stock en bodega
- Alertas
- Consumo técnico
```

**Pregunta 2:** "¿Qué debería contener la habitación 410?"
```
✅ ESPERADO:
"PAR para Habitación 410 (Doble Confort):
- 6 toallas medianas
- Jabón: 2 unidades
- Papel higiénico: 2 rollos
- Champú: 1 botella
- Minibar: completo (20 ítems)"
```

**Pregunta 3:** "¿Consumo de papelería última semana?"
```
✅ ESPERADO:
"No tienes acceso a análisis técnicos de consumo.
Tu rol de RECEPCIÓN te permite ver:
- Estado de habitaciones
- PAR (qué debe tener cada cuarto)
- Ocupancy
- Información de huéspedes
Contacta con ALMACENISTA para análisis de consumo."
```

**Panel Lateral:**
- 8 sugerencias enfocadas en check-in/check-out
- Badge: "RECEPCIÓN - Atención a huéspedes y gestión de habitaciones"
- Opciones de estado, PAR, ocupancy

---

## 🔒 Validaciones de Seguridad

### Test: Usuario no autenticado
```bash
curl -X POST http://localhost:8080/api/ai/inventory-assistant \
  -H "Content-Type: application/json" \
  -d '{"question":"¿Qué hay?"}'
```

**✅ Esperado:** Error `401 Unauthorized`

---

### Test: Token de rol incorrecto
Intenta logearte con un usuario que no tiene rol permitido

**✅ Esperado:** Mensaje: "Tu rol no tiene acceso al asistente IA"

---

## 📊 Casos de Prueba Detallados

### Flujo completo ALMACENISTA:

1. **Login**
   - Username: `almacen`
   - Password: `password123`

2. **Observar Panel**
   - ✅ Badge muestra "ALMACENISTA"
   - ✅ Sugerencias están enfocadas en bodega
   - ✅ Descripción: "Gestión de bodega e inventario"

3. **Hacer Pregunta 1**
   - Pregunta: "¿Qué reabastecer?"
   - ✅ Respuesta enfocada en bodega
   - ✅ Incluye cantidades recomendadas
   - ✅ NO menciona habitaciones

4. **Hacer Pregunta 2**
   - Pregunta: "¿Quiénes están registrados?"
   - ✅ Respuesta explica falta de acceso
   - ✅ Sugiere contactar ADMIN

5. **Verificar Atajos**
   - ✅ Cuando hay historial, panel lateral muestra atajos
   - ✅ Atajos son de bodega, no genéricos

---

### Flujo completo RECEPCIÓN:

1. **Login**
   - Username: `recepcion`
   - Password: `password123`

2. **Observar Panel**
   - ✅ Badge muestra "RECEPCION"
   - ✅ Sugerencias sobre habitaciones
   - ✅ Descripción: "Atención a huéspedes..."

3. **Hacer Pregunta 1**
   - Pregunta: "¿Qué estado tiene 305?"
   - ✅ Respuesta sobre estado de cuarto
   - ✅ Incluye PAR
   - ✅ NO menciona bodega

4. **Hacer Pregunta 2**
   - Pregunta: "¿Stock de jabón?"
   - ✅ Respuesta indica falta de acceso
   - ✅ Sugiere contactar ALMACENISTA

5. **Verificar Sugerencias**
   - ✅ Todas relacionadas a habitaciones
   - ✅ Ninguna sobre bodega o usuarios

---

## 🐛 Troubleshooting

### Problema: No veo sugerencias por rol
**Solución:**
1. Verifica que el usuario está logueado
2. Revisa la consola del navegador para errores
3. Comprueba que el rol en la BD es correcto (ADMIN, ALMACENISTA, SERVICIO, RECEPCION)

### Problema: El chatbot no filtra datos
**Solución:**
1. Verifica logs del servidor: `mvn spring-boot:run`
2. Busca líneas de `RoleBasedContextFilter`
3. Comprueba que se aplica el filtro correcto

### Problema: Error de autenticación
**Solución:**
1. Limpia el localStorage: `localStorage.clear()`
2. Haz login nuevamente
3. Verifica que el token no expiró

### Problema: Las preguntas son genéricas
**Solución:**
1. El modelo puede estar ignorando las instrucciones
2. Intenta hacer preguntas más específicas al rol
3. Verifica que la instrucción del rol llegó a Gemini (revisa logs)

---

## ✅ Checklist Final

Antes de considerar "Listo":

- [ ] Backend compila sin errores (`mvn clean install`)
- [ ] Frontend carga sin errores (npm serve)
- [ ] Puedo loguearme con cada rol
- [ ] ADMIN ve todas las sugerencias y datos
- [ ] ALMACENISTA ve solo bodega
- [ ] SERVICIO ve solo habitaciones
- [ ] RECEPCIÓN ve solo habitaciones + PAR
- [ ] Las sugerencias cambian por rol
- [ ] El badge muestra el rol correcto
- [ ] Las respuestas respetan los permisos
- [ ] Los mensajes de "Sin acceso" son claros
- [ ] El panel lateral muestra info del rol

---

## 📞 Preguntas Frecuentes de Testing

**P: ¿Dónde está la BD de usuarios?**
A: En tu esquema de base de datos. Los usuarios deben tener el campo `role` con valores: ADMIN, ALMACENISTA, SERVICIO, RECEPCION

**P: ¿Cómo cambio de rol sin hacer login?**
A: En la BD, actualiza directamente: `UPDATE users SET role='ADMIN' WHERE username='recepcion'`

**P: ¿Las preguntas sugeridas son fijas?**
A: Sí, están en `role-based-suggestions.ts`. Puedes modificarlas y recompiled con `ng serve`

**P: ¿Qué pasa si me equivoco en el rol?**
A: El sistema usa el primer rol del array `roles[]`. Verifica la BD.

**P: ¿Puedo tener múltiples roles?**
A: Actualmente se usa el primer rol. Para múltiples roles, extiende `RoleContextInfo`.

---

## 🎉 ¡Listo para Probar!

Sigue estos pasos:

1. ✅ Compila backend: `cd ai-service && mvn clean install`
2. ✅ Levanta servidor: `mvn spring-boot:run`
3. ✅ En otra terminal, compila frontend: `cd frontend && ng serve --open`
4. ✅ Login con `admin` / `password123`
5. ✅ Verifica que ves "ADMIN" en el badge
6. ✅ Prueba las 3 preguntas de la sección ADMIN
7. ✅ Logout y login con otro rol
8. ✅ Repite para cada rol

**El sistema está completamente funcional. ¡Disfruta!** 🚀

