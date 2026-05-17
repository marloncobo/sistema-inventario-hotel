# Ejemplos de Respuestas del Chatbot por Rol

Este documento muestra cómo el chatbot responde diferente para cada rol cuando recibe la misma pregunta.

---

## Pregunta Base: "¿Cuál es el estado general del inventario?"

---

## ADMIN - Respuesta Completa

### Datos Visible:
✓ Todos los productos
✓ Todos los usuarios y roles
✓ Todas las habitaciones
✓ Todos los reportes

### Respuesta Esperada:

```
El estado general del inventario del hotel es el siguiente:

📊 RESUMEN EJECUTIVO
- Productos totales en el sistema: 142
  • Activos: 118
  • Inactivos: 24
- Stock disponible en bodega: ✓ Óptimo
- Alertas activas: 8 (Crítica: 2, Alta: 3, Media: 3)

🏢 OCUPACIÓN Y OPERACIÓN
- Habitaciones totales: 80
  • Disponibles: 12
  • Ocupadas: 58
  • En limpieza: 10
- Usuarios activos en el sistema: 24
  • ADMIN: 2
  • ALMACENISTA: 3
  • SERVICIO: 12
  • RECEPCIÓN: 7

⚠️ PRODUCTOS EN RIESGO (Ordenados por criticidad)
1. Jabón líquido (código JL-001)
   - Stock actual: 5 unidades
   - Mínimo: 20 unidades
   - Consumo últimos 30 días: 45 unidades
   - Riesgo: CRÍTICO - Agotarse en 3.3 días
   
2. Papel higiénico (código PH-002)
   - Stock actual: 15 unidades
   - Mínimo: 30 unidades
   - Consumo últimos 30 días: 60 unidades
   - Riesgo: CRÍTICO - Agotarse en 7.5 días

[... más productos ...]

📈 ANÁLISIS DE CONSUMO (Últimos 30 días)
- Consumo total: 1,240 unidades
- Consumo promedio por producto: 10.5 unidades
- Productos más usados:
  1. Jabón líquido: 45 unidades
  2. Papel higiénico: 60 unidades
  3. Champú: 38 unidades

🏠 CONSUMO POR HABITACIÓN
- Habitación más consumidora: Suite (tipo) - 18 unidades/mes promedio
- Habitación menor consumo: Individual - 6 unidades/mes promedio

💡 RECOMENDACIONES ESTRATÉGICAS
1. URGENTE: Reabastecer Jabón líquido (crítico, agotarse en 3 días)
2. URGENTE: Reabastecer Papel higiénico (crítico, agotarse en 7 días)
3. Revisar asignación de productos a suites (mayor consumo)
4. Considerar aumentar stock mínimo de productos críticos
5. Evaluar proveedores para mejorar tiempos de entrega

El sistema está en condiciones de operación pero requiere atención inmediata
en reabastecimiento de productos críticos.
```

---

## ALMACENISTA - Respuesta Operativa

### Datos Visible:
✓ Productos (solo bodega)
✓ Stock y alertas
✓ Movimientos recientes
✗ Habitaciones
✗ Usuarios

### Respuesta Esperada:

```
Estado del inventario de bodega:

📦 INVENTARIO ACTUAL
- Productos totales activos en bodega: 118
- Categorías: 8
  • Aseo: 45 productos
  • Minibar: 28 productos
  • Otros: 45 productos

⚠️ ALERTAS ACTIVAS EN BODEGA
- Bajo stock: 5 productos
- Stock crítico: 2 productos

🚨 PRODUCTOS PARA REABASTECER (PRIORIDAD)

CRÍTICOS (Reabastecer HOY):
1. Jabón líquido (JL-001)
   - Stock actual: 5 unidades
   - Stock mínimo: 20 unidades
   - Consumo diario: 1.5 unidades
   - Días de cobertura: 3.3 días
   - Recomendación: Comprar 100 unidades

2. Papel higiénico (PH-002)
   - Stock actual: 15 unidades
   - Stock mínimo: 30 unidades
   - Consumo diario: 2 unidades
   - Días de cobertura: 7.5 días
   - Recomendación: Comprar 150 unidades

ALTO (Reabastecer esta semana):
3. Champú (CH-003)
   - Stock actual: 22 unidades
   - Stock mínimo: 30 unidades
   - Recomendación: Comprar 80 unidades

[...]

📋 MOVIMIENTOS RECIENTES (Últimas transacciones)
- Transferencia a piso 2: 20 unidades (hace 2 horas)
- Devolución de piso 3: 5 unidades (hace 4 horas)
- Recepción de proveedor ABC: 200 unidades (hace 1 día)

📊 TOP PRODUCTOS MÁS USADOS
1. Jabón líquido: 45 unidades/mes
2. Papel higiénico: 60 unidades/mes
3. Champú: 38 unidades/mes

✅ ACCIONES INMEDIATAS RECOMENDADAS
1. Contactar proveedor para compra urgente de Jabón y Papel
2. Preparar pedidos de reabastecimiento con cantidades sugeridas
3. Realizar conteo físico en bodega (verificar discrepancias)
4. Transferir stock a pisos según consumo proyectado
```

---

## SERVICIO - Respuesta Operativa de Cuartos

### Datos Visible:
✓ Productos (solo aseo/minibar)
✓ Consumo por habitación
✗ Stock en bodega
✗ Alertas
✗ Usuarios

### Respuesta Esperada:

```
Estado de productos y consumo por habitación:

🛏️ CONSUMO POR TIPO DE HABITACIÓN (Últimos 30 días)

Suites (12 cuartos):
- Consumo total: 216 unidades
- Consumo promedio: 18 unidades/habitación
- Productos principales:
  • Jabón: 8 unidades/habitación/mes
  • Papel: 5 unidades/habitación/mes
  • Champú: 3 unidades/habitación/mes

Dobles (32 cuartos):
- Consumo total: 384 unidades
- Consumo promedio: 12 unidades/habitación
- Productos principales:
  • Jabón: 5 unidades/habitación/mes
  • Papel: 4 unidades/habitación/mes
  • Champú: 2 unidades/habitación/mes

Individuales (36 cuartos):
- Consumo total: 216 unidades
- Consumo promedio: 6 unidades/habitación
- Productos principales:
  • Jabón: 3 unidades/habitación/mes
  • Papel: 2 unidades/habitación/mes
  • Champú: 1 unidad/habitación/mes

📍 DISTRIBUCIÓN ACTUAL DE PRODUCTOS

Habitaciones en piso 3 (Suites):
- Jabón: 8 unidades (bueno)
- Papel: 4 unidades (necesita reposición)
- Champú: 3 unidades (bueno)

[... más pisos ...]

🔄 TUS MOVIMIENTOS RECIENTES
- Entrega a piso 2: 45 unidades (hace 3 horas)
- Devolución de piso 4: 8 unidades (hace 5 horas)
- Entrega a piso 3: 60 unidades (ayer)

💡 RECOMENDACIONES POR CUARTO

Cuartos que necesitan reposición AHORA:
- Piso 3, Suite 301: Falta papel higiénico
- Piso 3, Suite 305: Falta champú
- Piso 2, Doble 210: Falta jabón y papel
- Piso 2, Doble 215: Falta champú

[...]

✅ SUGERENCIAS
1. Reabastecer papel en todas las Suites hoy
2. Aumentar jabón en pisos 2 y 3 (mayor ocupancy)
3. Las Individuales tienen suficiente consumo esperado
4. Coordinar devoluciones cada 2 días con bodega
```

---

## RECEPCIÓN - Respuesta Enfocada en Habitaciones

### Datos Visible:
✓ Habitaciones (estado)
✓ Consumo por habitación
✗ Stock bodega
✗ Alertas
✗ Otros usuarios

### Respuesta Esperada:

```
Estado de habitaciones e inventario asignado:

🏢 OCUPACIÓN ACTUAL
- Habitaciones disponibles: 12
- Habitaciones ocupadas: 58
- En limpieza: 10

📊 ESTADO POR PISO

PISO 2 (Dobles - 10 cuartos)
- 201: DISPONIBLE (Limpia) ✓
- 202: OCUPADA (Juan López) ✓
- 203: OCUPADA (María García) → Requiere servicio de limpieza URGENTE
- 204: EN LIMPIEZA ⏳
- ...

PISO 3 (Suites - 8 cuartos)
- 301: OCUPADA (VIP - Familia Rodríguez) → Stock completo ✓
- 302: DISPONIBLE (Limpia) ✓
- 303: DISPONIBLE (Requiere reposición de aseo) ⚠️
- 304: OCUPADA (Ejecutiva - Roberto Martínez) ✓
- ...

PISO 4 (Individuales - 14 cuartos)
- 401-410: Mayoría disponibles ✓
- 412: OCUPADA (Turista - Michel Dupont) ✓
- Todas con stock básico ✓

❓ CONSULTAS DE HUÉSPEDES RECIENTES
- Habitación 305: Solicitó 2 toallas adicionales (procesado)
- Habitación 210: Preguntó sobre minibar (disponible y lleno)
- Habitación 307: Reportó falta de champú (reposición en progreso)

📋 PAR (PRODUCTO ASIGNADO POR ROL) - QUÉ DEBE TENER CADA HABITACIÓN

Suite Standard (301-308):
- 8 toallas grandes
- Jabón: 3 unidades
- Papel higiénico: 2 rollos
- Champú: 2 botellas
- Minibar: completo (30 ítems)

Doble Confort (201-210):
- 6 toallas medianas
- Jabón: 2 unidades
- Papel higiénico: 2 rollos
- Champú: 1 botella
- Minibar: completo (20 ítems)

Individual (401-436):
- 4 toallas pequeñas
- Jabón: 1 unidad
- Papel higiénico: 1 rollo
- Champú: 1 botella
- Minibar: básico (12 ítems)

✅ RESUMEN OPERATIVO
- Ocupancy: 72.5% (58/80 habitaciones)
- Habitaciones preparadas: 15 (listas para entrar)
- Reposiciones pendientes: 4
- VIP actual: 2 habitaciones (requieren servicio especial)

Siguiente check-out: 12:00 (3 habitaciones)
Próximos check-in: 14:00 (5 habitaciones)
```

---

## Comparación Visual: Misma Pregunta, Diferentes Respuestas

| Aspecto | ADMIN | ALMACENISTA | SERVICIO | RECEPCIÓN |
|---------|-------|-------------|----------|-----------|
| **Acceso a Stock Bodega** | ✅ Completo | ✅ Completo | ❌ No | ❌ No |
| **Acceso a Usuarios** | ✅ Completo | ❌ No | ❌ No | ⚠️ Básico |
| **Acceso a Habitaciones** | ✅ Completo | ❌ No | ⚠️ Limitado | ✅ Completo |
| **Acceso a Alertas** | ✅ Sí | ✅ Sí | ❌ No | ❌ No |
| **Focus de Respuesta** | Estratégico | Operativo Bodega | Operativo Cuartos | Operativo Mostrador |
| **Nivel de Detalle** | Muy Alto | Alto | Medio | Medio-Alto |

---

## Otra Pregunta: "¿Quiénes son los usuarios del sistema?"

### ADMIN - Respuesta Completa
```
Usuarios activos en el sistema (24 usuarios):

ADMINISTRADORES (2):
1. admin@hotel.com (Carlos Mendoza)
   - Estado: Activo
   - Hotel: Hotel Central
   - Último acceso: Hoy 10:30

2. admin2@hotel.com (Patricia Gómez)
   - Estado: Activo
   - Hotel: Hotel Central
   - Último acceso: Hoy 09:15

ALMACENISTAS (3):
1. juan.almacen@hotel.com (Juan Pérez)
   - Estado: Activo
   - Área: Bodega Central
   
[... más detalles ...]
```

### ALMACENISTA - Respuesta: Acceso Denegado
```
⚠️ No tienes acceso a esta información.

Según tu rol de ALMACENISTA, solo puedes consultar:
- Inventario y stock de bodega
- Movimientos de productos
- Alertas de bajo stock
- Reabastecimiento recomendado

Para información de usuarios, contacta con el ADMINISTRADOR.
```

### SERVICIO - Respuesta: Acceso Denegado
```
⚠️ No tienes acceso a información de usuarios del sistema.

Tu rol de SERVICIO te permite:
- Consultar productos por habitación
- Ver tu consumo y movimientos propios
- Registrar entregas y devoluciones

Para cualquier consulta sobre usuarios,
contacta con el mostrador de RECEPCIÓN.
```

### RECEPCIÓN - Respuesta: Información Limitada
```
Información de usuarios del sistema (Básica):

ADMINISTRACIÓN:
- 2 administradores activos

ALMACENISTA:
- 3 almacenistas activos

PERSONAL DE SERVICIOS:
- 12 personas en limpieza/housekeeping activas

PERSONAL DE MOSTRADOR:
- 7 recepcionistas activos (incluyéndote)

Para detalles específicos de contacto de algún compañero,
consulta el directorio interno o contacta con ADMINISTRACIÓN.
```

---

## Beneficios de este Diseño

✅ **Seguridad:** Cada rol solo ve lo que necesita
✅ **Claridad:** Mensajes explícitos sobre lo que NO se puede ver
✅ **Eficiencia:** Respuestas fokusadas en la responsabilidad de cada rol
✅ **Entrenamiento:** Enseña al modelo qué datos no debería inventar
✅ **Auditoría:** Es claro quién preguntó qué (basado en rol)
✅ **Escalabilidad:** Fácil agregar nuevos roles/permisos

