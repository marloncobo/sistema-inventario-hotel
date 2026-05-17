/**
 * Sugerencias de preguntas adaptadas por rol
 * Se muestran como Quick Prompts en el asistente
 */

export interface QuestionSuggestion {
  text: string;
  icon: string;
  category: string;
}

export const ADMIN_SUGGESTIONS: QuestionSuggestion[] = [
  {
    text: '¿Cuál es el estado general del sistema?',
    icon: 'pi-chart-bar',
    category: 'Visión Estratégica'
  },
  {
    text: '¿Qué riesgos operativos identificas?',
    icon: 'pi-exclamation-triangle',
    category: 'Riesgos'
  },
  {
    text: '¿Cuál es la ocupancy actual del hotel?',
    icon: 'pi-home',
    category: 'Habitaciones'
  },
  {
    text: '¿Quiénes son los usuarios activos del sistema?',
    icon: 'pi-users',
    category: 'Usuarios'
  },
  {
    text: '¿Análisis de consumo últimos 30 días?',
    icon: 'pi-chart-line',
    category: 'Consumo'
  },
  {
    text: '¿Qué recomendaciones tienes para mejorar?',
    icon: 'pi-lightbulb',
    category: 'Estrategia'
  },
  {
    text: '¿Productos con mayor riesgo?',
    icon: 'pi-bell',
    category: 'Alertas'
  },
  {
    text: '¿Cómo está la relación ingresos vs gastos?',
    icon: 'pi-dollar',
    category: 'Finanzas'
  }
];

export const ALMACENISTA_SUGGESTIONS: QuestionSuggestion[] = [
  {
    text: '¿Qué productos necesito reabastecer?',
    icon: 'pi-shopping-cart',
    category: 'Reabastecimiento'
  },
  {
    text: '¿Cuáles son los productos con stock crítico?',
    icon: 'pi-exclamation-triangle',
    category: 'Alertas'
  },
  {
    text: '¿Consumo de productos últimos 30 días?',
    icon: 'pi-chart-line',
    category: 'Consumo'
  },
  {
    text: '¿Movimientos recientes en bodega?',
    icon: 'pi-sync',
    category: 'Movimientos'
  },
  {
    text: '¿Top 10 productos más usados?',
    icon: 'pi-list',
    category: 'Estadísticas'
  },
  {
    text: '¿Cuánto jabón debería tener en bodega?',
    icon: 'pi-box',
    category: 'Productos'
  },
  {
    text: '¿Alertas de bajo stock activas?',
    icon: 'pi-bell',
    category: 'Alertas'
  },
  {
    text: '¿Qué productos están agotados?',
    icon: 'pi-times',
    category: 'Stock'
  }
];

export const SERVICIO_SUGGESTIONS: QuestionSuggestion[] = [
  {
    text: '¿Qué productos necesita la habitación 305?',
    icon: 'pi-home',
    category: 'Habitaciones'
  },
  {
    text: '¿Consumo esperado por tipo de cuarto?',
    icon: 'pi-chart-bar',
    category: 'Consumo'
  },
  {
    text: '¿Cuántos productos sobran de la entrega?',
    icon: 'pi-inbox',
    category: 'Devoluciones'
  },
  {
    text: '¿Qué suites consumieron más?',
    icon: 'pi-chart-line',
    category: 'Estadísticas'
  },
  {
    text: '¿Productos que debo reponer en pisos?',
    icon: 'pi-shopping-cart',
    category: 'Reposición'
  },
  {
    text: '¿Cuánto aseo por habitación?',
    icon: 'pi-box',
    category: 'Productos'
  },
  {
    text: '¿Mis movimientos recientes?',
    icon: 'pi-sync',
    category: 'Mi Actividad'
  },
  {
    text: '¿Habitaciones ocupadas vs disponibles?',
    icon: 'pi-home',
    category: 'Ocupancy'
  }
];

export const RECEPCION_SUGGESTIONS: QuestionSuggestion[] = [
  {
    text: '¿Qué estado tiene la habitación 305?',
    icon: 'pi-home',
    category: 'Habitaciones'
  },
  {
    text: '¿Qué debería contener la habitación 410?',
    icon: 'pi-list',
    category: 'PAR'
  },
  {
    text: '¿Cuántas habitaciones están disponibles?',
    icon: 'pi-check',
    category: 'Disponibilidad'
  },
  {
    text: '¿Habitaciones en limpieza?',
    icon: 'pi-refresh',
    category: 'Estado'
  },
  {
    text: '¿Ocupancy actual del hotel?',
    icon: 'pi-chart-bar',
    category: 'Ocupancy'
  },
  {
    text: '¿Consumo de la habitación 215?',
    icon: 'pi-chart-line',
    category: 'Consumo'
  },
  {
    text: '¿Quién está en la habitación 301?',
    icon: 'pi-user',
    category: 'Huéspedes'
  },
  {
    text: '¿Check-outs próximos?',
    icon: 'pi-calendar',
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
  ADMIN: 'Acceso completo a todos los datos del sistema',
  ALMACENISTA: 'Gestión de bodega e inventario',
  SERVICIO: 'Operaciones de habitaciones y limpieza',
  RECEPCION: 'Atención a huéspedes y gestión de habitaciones'
};

export const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#FF6B6B',
  ALMACENISTA: '#4ECDC4',
  SERVICIO: '#45B7D1',
  RECEPCION: '#FFA07A'
};
