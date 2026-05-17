import type { NavigationCategory, NavigationItem } from '@models/navigation.model';
import {
  rolesForShellRoute,
  SIDEBAR_CATALOGOS_ADMIN_ROLES,
  SIDEBAR_PROVEEDORES_NAV_ROLES
} from './role-nav-access';

/**
 * Menú lateral: cada ítem usa `rolesForShellRoute` (misma regla que `roleGuard`).
 * No añadir roles a mano: actualizar `role-nav-access.ts`.
 */
export const APP_NAV_CATEGORIES: NavigationCategory[] = [
  {
    id: 'overview',
    label: 'Resumen',
    shortLabel: 'Inicio',
    icon: 'pi pi-chart-bar',
    eyebrow: 'Visión general',
    description: 'Tablero según tu rol.',
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
    description: 'Inventario y habitaciones según rol.',
    groups: [
      {
        title: 'Inventario',
        items: [
          {
            label: 'Inventario',
            route: '/inventario',
            icon: 'pi pi-warehouse',
            description: 'Bodega (admin/almacén) o consulta y devoluciones (servicio).',
            roles: rolesForShellRoute('inventario')
          },
          {
            label: 'Ubicaciones',
            route: '/ubicaciones',
            icon: 'pi pi-map-marker',
            description: 'Ubicaciones físicas del inventario.',
            roles: rolesForShellRoute('ubicaciones')
          },
          {
            label: 'Documentos',
            route: '/documentos',
            icon: 'pi pi-file-edit',
            description: 'Órdenes de compra, recepciones, transferencias y ajustes.',
            roles: rolesForShellRoute('documentos')
          },
          {
            label: 'PAR habitaciones',
            route: '/par-habitaciones',
            icon: 'pi pi-list-check',
            description: 'Plantillas PAR y comparación (bodega y servicio).',
            roles: rolesForShellRoute('par-habitaciones')
          },
          {
            label: 'Reposición',
            route: '/reposicion',
            icon: 'pi pi-truck',
            description: 'Sugerencias según faltantes PAR y stock en bodega.',
            roles: rolesForShellRoute('reposicion')
          },
          {
            label: 'Conteos físicos',
            route: '/conteos',
            icon: 'pi pi-calculator',
            description: 'Toma de inventario físico por ubicación.',
            roles: rolesForShellRoute('conteos')
          },
          {
            label: 'Diferencias',
            route: '/diferencias',
            icon: 'pi pi-exclamation-circle',
            description: 'Aprobar y aplicar diferencias de conteos.',
            roles: rolesForShellRoute('diferencias')
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
            description: 'Listado, detalle y cambio de estado (recepción).',
            roles: rolesForShellRoute('habitaciones')
          },
          {
            label: 'Consulta por número',
            route: '/habitaciones/consulta',
            icon: 'pi pi-search',
            description: 'Buscar habitación; recepción incluye comparación PAR aquí.',
            roles: rolesForShellRoute('habitaciones/consulta')
          },
          {
            label: 'Asignaciones',
            route: '/asignaciones',
            icon: 'pi pi-calendar-plus',
            description: 'Entrega en habitación (servicio y administración).',
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
    description: 'Movimientos, alertas y auditoría.',
    groups: [
      {
        title: 'Monitoreo',
        items: [
          {
            label: 'Movimientos',
            route: '/movimientos',
            icon: 'pi pi-history',
            description: 'Historial de movimientos de inventario.',
            roles: rolesForShellRoute('movimientos')
          },
          {
            label: 'Alertas',
            route: '/alertas',
            icon: 'pi pi-bell',
            description: 'Alertas y stock bajo.',
            roles: rolesForShellRoute('alertas')
          },
          {
            label: 'Auditoría',
            route: '/auditoria',
            icon: 'pi pi-lock',
            description: 'Bitácoras del sistema.',
            roles: rolesForShellRoute('auditoria')
          },
          {
            label: 'Asistente IA',
            route: '/asistente-ia',
            icon: 'pi pi-sparkles',
            description: 'Consultas guiadas según tu rol.',
            roles: rolesForShellRoute('asistente-ia')
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
    description: 'Reportes de habitaciones e inventario.',
    groups: [
      {
        title: 'Reportes',
        items: [
          {
            label: 'Reportes',
            route: '/reportes',
            icon: 'pi pi-file-pdf',
            description: 'Consumo y distribución por habitaciones.',
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
    description: 'Usuarios y catálogos.',
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
            description: 'Directorio de proveedores.',
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
