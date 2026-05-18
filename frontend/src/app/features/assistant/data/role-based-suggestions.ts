/**
 * Sugerencias de preguntas adaptadas por rol - DISEÑADAS POR DATOS REALES
 *
 * Cada rol tiene acceso a datos específicos (visto en RoleBasedContextFilter):
 *
 * ADMIN: Todos los datos (items, movimientos, alertas, users, rooms, consumo, distribución, áreas, proveedores)
 * ALMACENISTA: Items, alertas, movimientos, top-usado, inventoryReport, áreas de BODEGA SOLO
 * SERVICIO: Items de ASEO/LIMPIEZA, movimientos de SERVICIO, consumo habitaciones, distribución habitaciones
 * RECEPCION: Rooms, consumo habitaciones, datos básicos de usuarios (sin sensibles)
 */

export interface QuestionSuggestion {
  text: string;
  icon: string;
  category: string;
}

export const ADMIN_SUGGESTIONS: QuestionSuggestion[] = [
  {
    text: '¿Cuál es el estado general del inventario?',
    icon: 'pi-chart-bar',
    category: 'Dashboard'
  },
  {
    text: '¿Qué productos tienen stock crítico?',
    icon: 'pi-exclamation-triangle',
    category: 'Alertas'
  },
  {
    text: '¿Cuáles son los 10 productos más usados?',
    icon: 'pi-chart-line',
    category: 'Análisis'
  },
  {
    text: '¿Cuál es el consumo promedio por tipo de habitación?',
    icon: 'pi-home',
    category: 'Operaciones'
  },
  {
    text: '¿Qué usuarios han registrado movimientos hoy?',
    icon: 'pi-users',
    category: 'Auditoría'
  },
  {
    text: '¿Cuáles son los movimientos recientes en todas las áreas?',
    icon: 'pi-sync',
    category: 'Trazabilidad'
  },
  {
    text: '¿Quiénes son nuestros proveedores principales?',
    icon: 'pi-briefcase',
    category: 'Proveedores'
  },
  {
    text: '¿Cómo se distribuyen los productos por categoría?',
    icon: 'pi-list',
    category: 'Inventario'
  }
];

export const ALMACENISTA_SUGGESTIONS: QuestionSuggestion[] = [
  {
    text: '¿Qué productos debo reabastecer hoy?',
    icon: 'pi-shopping-cart',
    category: 'Acción Inmediata'
  },
  {
    text: '¿Cuáles son los productos con stock crítico?',
    icon: 'pi-bell',
    category: 'Alertas'
  },
  {
    text: '¿Cuál es el consumo por categoría en los últimos 30 días?',
    icon: 'pi-chart-line',
    category: 'Tendencias'
  },
  {
    text: '¿Qué movimientos se registraron esta semana?',
    icon: 'pi-sync',
    category: 'Control'
  },
  {
    text: '¿Cuáles son los productos más solicitados?',
    icon: 'pi-star',
    category: 'Estadísticas'
  },
  {
    text: '¿Cuál es el stock actual de cada producto?',
    icon: 'pi-box',
    category: 'Inventario'
  },
  {
    text: '¿Qué productos necesitaré reabastecer en una semana?',
    icon: 'pi-calendar',
    category: 'Proyección'
  },
  {
    text: '¿Hay alertas activas de bajo stock?',
    icon: 'pi-exclamation-triangle',
    category: 'Alertas'
  }
];

export const SERVICIO_SUGGESTIONS: QuestionSuggestion[] = [
  {
    text: '¿Cuánto producto de aseo necesita la habitación 305?',
    icon: 'pi-home',
    category: 'Habitaciones'
  },
  {
    text: '¿Cuál es el consumo promedio de limpieza por tipo de cuarto?',
    icon: 'pi-chart-bar',
    category: 'Planificación'
  },
  {
    text: '¿Cuáles son los productos de aseo más usados?',
    icon: 'pi-chart-line',
    category: 'Estadísticas'
  },
  {
    text: '¿Cuánto producto necesito para ocupar 15 habitaciones?',
    icon: 'pi-calculator',
    category: 'Estimación'
  },
  {
    text: '¿Qué movimientos he registrado esta semana?',
    icon: 'pi-sync',
    category: 'Mi Actividad'
  },
  {
    text: '¿Cuál es la diferencia entre consumo real y esperado?',
    icon: 'pi-exclamation-circle',
    category: 'Control'
  },
  {
    text: '¿Hay disponibilidad de productos de limpieza?',
    icon: 'pi-box',
    category: 'Disponibilidad'
  },
  {
    text: '¿Cómo se distribuye el consumo por piso?',
    icon: 'pi-building',
    category: 'Análisis'
  }
];

export const RECEPCION_SUGGESTIONS: QuestionSuggestion[] = [
  {
    text: '¿Cuántas habitaciones están disponibles ahora?',
    icon: 'pi-check',
    category: 'Disponibilidad'
  },
  {
    text: '¿Cuál es el estado de la habitación 305?',
    icon: 'pi-home',
    category: 'Habitaciones'
  },
  {
    text: '¿Cuál es la ocupancy actual del hotel?',
    icon: 'pi-chart-bar',
    category: 'Estadísticas'
  },
  {
    text: '¿Cuántas habitaciones están en limpieza?',
    icon: 'pi-refresh',
    category: 'Estado'
  },
  {
    text: '¿Cuál es el consumo promedio por habitación?',
    icon: 'pi-chart-line',
    category: 'Información'
  },
  {
    text: '¿Hay habitaciones con problemas de inventario?',
    icon: 'pi-exclamation-triangle',
    category: 'Alertas'
  },
  {
    text: '¿Qué usuarios del equipo están activos hoy?',
    icon: 'pi-users',
    category: 'Equipo'
  },
  {
    text: '¿Cómo se distribuyen los huéspedes por tipo de cuarto?',
    icon: 'pi-chart-pie',
    category: 'Operación'
  }
];

export function getSuggestionsForRole(role: string | null): QuestionSuggestion[] {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
      return ADMIN_SUGGESTIONS;
    case 'ALMACENISTA':
      return ALMACENISTA_SUGGESTIONS;
    case 'SERVICIO':
      return SERVICIO_SUGGESTIONS;
    case 'RECEPCION':
      return RECEPCION_SUGGESTIONS;
    default:
      return RECEPCION_SUGGESTIONS;
  }
}

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: 'Control total: inventario, operaciones, usuarios y auditoría',
  ALMACENISTA: 'Gestión de bodega: stock, alertas y reabastecimiento',
  SERVICIO: 'Reposición de productos de limpieza en habitaciones',
  RECEPCION: 'Disponibilidad de habitaciones y atención a huéspedes'
};

export const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#FF6B6B',
  ALMACENISTA: '#4ECDC4',
  SERVICIO: '#45B7D1',
  RECEPCION: '#FFA07A'
};
