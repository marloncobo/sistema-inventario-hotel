import type { NavigationCategory, NavigationItem } from '@models/navigation.model';
import {
  rolesForShellRoute,
  SIDEBAR_CATALOGOS_ADMIN_ROLES,
  SIDEBAR_PROVEEDORES_NAV_ROLES
} from './shell-route-roles';

/**
 * Menú lateral: cada ítem usa `rolesForShellRoute` (misma regla que `roleGuard` en `app.routes.ts`).
 * El sidebar filtra con `hasAnyRole`; las categorías/grupos vacíos se omiten.
 */
export const APP_NAV_CATEGORIES: NavigationCategory[] = [
  {
    id: 'overview',
    label: 'Resumen',
    shortLabel: 'Inicio',
    icon: 'pi pi-chart-bar',
    eyebrow: 'Visión general',
    description: 'Tablero común; el contenido depende de lo que tu rol puede consultar en el backend.',
    groups: [
      {
        title: 'Inicio',
        items: [
          {
            label: 'Dashboard',
            route: '/dashboard',
            icon: 'pi pi-th-large',
            description: 'Indicadores y accesos rápidos según permisos.',
            roles: rolesForShellRoute('dashboard')
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
    eyebrow: 'Día a día',
    description: 'Inventario, habitaciones y asignaciones según rol.',
    groups: [
      {
        title: 'Inventario',
        items: [
          {
            label: 'Inventario',
            route: '/inventario',
            icon: 'pi pi-warehouse',
            description: 'Insumos, stock bajo en lectura y operaciones permitidas (entradas solo admin/almacén; devoluciones y salidas según rol).',
            roles: rolesForShellRoute('inventario')
          }
        ]
      },
      {
        title: 'Habitaciones',
        items: [
          {
            label: 'Habitaciones',
            route: '/habitaciones',
            icon: 'pi pi-home',
            description: 'Listado y detalle; creación solo administrador; cambio de estado administrador y recepción; almacenista consulta.',
            roles: rolesForShellRoute('habitaciones')
          },
          {
            label: 'Consulta por número',
            route: '/habitaciones/consulta',
            icon: 'pi pi-search',
            description: 'Validación rápida por número (tres dígitos); misma API que el listado detallado.',
            roles: rolesForShellRoute('habitaciones/consulta')
          },
          {
            label: 'Asignaciones',
            route: '/asignaciones',
            icon: 'pi pi-calendar-plus',
            description: 'Registrar entregas a habitaciones (no disponible para recepción por API).',
            roles: rolesForShellRoute('asignaciones')
          }
        ]
      }
    ]
  },
  {
    id: 'control',
    label: 'Control y trazabilidad',
    shortLabel: 'Control',
    icon: 'pi pi-shield',
    eyebrow: 'Inventario',
    description: 'Movimientos, alertas y auditoría restringidos por rol.',
    groups: [
      {
        title: 'Monitoreo',
        items: [
          {
            label: 'Movimientos',
            route: '/movimientos',
            icon: 'pi pi-history',
            description: 'Historial completo de movimientos de inventario.',
            roles: rolesForShellRoute('movimientos')
          },
          {
            label: 'Alertas',
            route: '/alertas',
            icon: 'pi pi-bell',
            description: 'Alertas y stock bajo del inventario.',
            roles: rolesForShellRoute('alertas')
          },
          {
            label: 'Auditoría',
            route: '/auditoria',
            icon: 'pi pi-lock',
            description: 'Bitácoras de autenticación, inventario y habitaciones.',
            roles: rolesForShellRoute('auditoria')
          }
        ]
      }
    ]
  },
  {
    id: 'analysis',
    label: 'Análisis',
    shortLabel: 'Datos',
    icon: 'pi pi-sliders-h',
    eyebrow: 'Reportes',
    description: 'Reportes de habitaciones para recepción; administrador incluye inventario y exportación.',
    groups: [
      {
        title: 'Reportes',
        items: [
          {
            label: 'Reportes',
            route: '/reportes',
            icon: 'pi pi-file-pdf',
            description: 'Recepción: consumo y distribución por habitaciones. Exportación solo administrador.',
            roles: rolesForShellRoute('reportes')
          }
        ]
      }
    ]
  },
  {
    id: 'settings',
    label: 'Administración',
    shortLabel: 'Admin',
    icon: 'pi pi-cog',
    eyebrow: 'Configuración',
    description: 'Usuarios y catálogos maestros; proveedores para almacenista.',
    groups: [
      {
        title: 'Sistema',
        items: [
          {
            label: 'Usuarios',
            route: '/usuarios',
            icon: 'pi pi-users',
            description: 'Gestión de usuarios y roles.',
            roles: rolesForShellRoute('usuarios')
          },
          {
            label: 'Catálogos',
            route: '/catalogos',
            icon: 'pi pi-list',
            description: 'Categorías, unidades, proveedores y áreas.',
            roles: SIDEBAR_CATALOGOS_ADMIN_ROLES
          }
        ]
      },
      {
        title: 'Proveedores',
        items: [
          {
            label: 'Proveedores',
            route: '/catalogos',
            icon: 'pi pi-truck',
            description: 'Directorio de proveedores (misma pantalla de catálogos, sección proveedores).',
            roles: SIDEBAR_PROVEEDORES_NAV_ROLES
          }
        ]
      }
    ]
  }
];

export const APP_NAV_ITEMS: NavigationItem[] = APP_NAV_CATEGORIES.flatMap((category) =>
  category.groups.flatMap((group) => group.items)
);
