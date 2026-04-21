import type { NavigationCategory, NavigationItem } from '@models/navigation.model';

export const APP_NAV_CATEGORIES: NavigationCategory[] = [
  {
    id: 'overview',
    label: 'Resumen',
    shortLabel: 'Inicio',
    icon: 'pi pi-chart-bar',
    eyebrow: 'Visión General',
    description: 'Tablero de métricas principales y accesos rápidos.',
    groups: [
      {
        title: 'Mando Central',
        items: [
          {
            label: 'Dashboard',
            route: '/dashboard',
            icon: 'pi pi-th-large',
            description: 'Vista ejecutiva del estado del hotel.',
            roles: ['ADMIN', 'ALMACENISTA', 'RECEPCION', 'SERVICIO']
          }
        ]
      }
    ]
  },
  {
    id: 'operations',
    label: 'Operaciones',
    shortLabel: 'Ops',
    icon: 'pi pi-box',
    eyebrow: 'Gestión Operativa',
    description: 'Atención diaria, stock y distribución de insumos.',
    groups: [
      {
        title: 'Gestión de Stock',
        items: [
          {
            label: 'Inventario',
            route: '/inventario',
            icon: 'pi pi-warehouse',
            description: 'Control de existencias y almacenes.',
            roles: ['ADMIN', 'ALMACENISTA', 'SERVICIO']
          }
        ]
      },
      {
        title: 'Servicio al Huésped',
        items: [
          {
            label: 'Habitaciones',
            route: '/habitaciones',
            icon: 'pi pi-home',
            description: 'Estado y control de unidades habitacionales.',
            roles: ['ADMIN', 'ALMACENISTA', 'RECEPCION']
          },
          {
            label: 'Asignaciones',
            route: '/asignaciones',
            icon: 'pi pi-calendar-plus',
            description: 'Entrega de suministros a habitaciones.',
            roles: ['ADMIN', 'ALMACENISTA', 'RECEPCION', 'SERVICIO']
          }
        ]
      }
    ]
  },
  {
    id: 'control',
    label: 'Control',
    shortLabel: 'Ctl',
    icon: 'pi pi-shield',
    eyebrow: 'Seguridad y Trazabilidad',
    description: 'Auditoría, movimientos de stock y alertas operativas.',
    groups: [
      {
        title: 'Monitoreo',
        items: [
          {
            label: 'Movimientos',
            route: '/movimientos',
            icon: 'pi pi-history',
            description: 'Historial detallado de todas las transacciones.',
            roles: ['ADMIN', 'ALMACENISTA']
          },
          {
            label: 'Alertas',
            route: '/alertas',
            icon: 'pi pi-bell',
            description: 'Notificaciones de stock bajo y anomalías.',
            roles: ['ADMIN', 'ALMACENISTA']
          },
          {
            label: 'Auditoría',
            route: '/auditoria',
            icon: 'pi pi-lock',
            description: 'Bitácora técnica de seguridad y cambios.',
            roles: ['ADMIN']
          }
        ]
      }
    ]
  },
  {
    id: 'analysis',
    label: 'Análisis',
    shortLabel: 'Analítica',
    icon: 'pi pi-sliders-h',
    eyebrow: 'Reportes y Datos',
    description: 'Generación de documentos y análisis de rendimiento.',
    groups: [
      {
        title: 'Inteligencia',
        items: [
          {
            label: 'Reportes',
            route: '/reportes',
            icon: 'pi pi-file-pdf',
            description: 'Reportes operativos exportables y métricas.',
            roles: ['ADMIN', 'RECEPCION']
          }
        ]
      }
    ]
  },
  {
    id: 'settings',
    label: 'Configuración',
    shortLabel: 'Conf',
    icon: 'pi pi-cog',
    eyebrow: 'Administración',
    description: 'Gestión de usuarios, catálogos y parámetros base.',
    groups: [
      {
        title: 'Sistema',
        items: [
          {
            label: 'Usuarios',
            route: '/usuarios',
            icon: 'pi pi-users',
            description: 'Control de accesos y perfiles de usuario.',
            roles: ['ADMIN']
          },
          {
            label: 'Catálogos',
            route: '/catalogos',
            icon: 'pi pi-list',
            description: 'Listado de proveedores, áreas y categorías.',
            roles: ['ADMIN', 'ALMACENISTA']
          }
        ]
      }
    ]
  }
];

export const APP_NAV_ITEMS: NavigationItem[] = APP_NAV_CATEGORIES.flatMap((category) =>
  category.groups.flatMap((group) => group.items)
);
