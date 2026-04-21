import type { NavigationItem } from '@models/navigation.model';

export const APP_NAV_ITEMS: NavigationItem[] = [
  {
    label: 'Dashboard',
    route: '/dashboard',
    icon: 'pi pi-home',
    description: 'Vista ejecutiva con accesos rápidos y métricas iniciales.',
    section: 'Principal',
    roles: ['ADMIN', 'ALMACENISTA', 'RECEPCION', 'SERVICIO']
  },
  {
    label: 'Usuarios',
    route: '/usuarios',
    icon: 'pi pi-users',
    description: 'Administración de usuarios internos y revisión de roles.',
    section: 'Configuración',
    roles: ['ADMIN']
  },
  {
    label: 'Auditoría',
    route: '/auditoria',
    icon: 'pi pi-shield',
    description: 'Consulta de bitácoras de autenticación, inventario y habitaciones.',
    section: 'Control',
    roles: ['ADMIN']
  },
  {
    label: 'Catálogos',
    route: '/catalogos',
    icon: 'pi pi-tags',
    description: 'Catálogos operativos de categorías, unidades, áreas y proveedores.',
    section: 'Configuración',
    roles: ['ADMIN', 'ALMACENISTA']
  },
  {
    label: 'Inventario',
    route: '/inventario',
    icon: 'pi pi-warehouse',
    description: 'Gestión de insumos, stock y operaciones sobre inventario.',
    section: 'Operación',
    roles: ['ADMIN', 'ALMACENISTA', 'SERVICIO']
  },
  {
    label: 'Movimientos',
    route: '/movimientos',
    icon: 'pi pi-arrow-right-arrow-left',
    description: 'Historial de entradas, salidas, devoluciones y anulaciones.',
    section: 'Control',
    roles: ['ADMIN', 'ALMACENISTA']
  },
  {
    label: 'Alertas',
    route: '/alertas',
    icon: 'pi pi-bell',
    description: 'Seguimiento de stock bajo y alertas operativas abiertas.',
    section: 'Control',
    roles: ['ADMIN', 'ALMACENISTA']
  },
  {
    label: 'Habitaciones',
    route: '/habitaciones',
    icon: 'pi pi-building',
    description: 'Consulta, alta y control del estado operativo de habitaciones.',
    section: 'Operación',
    roles: ['ADMIN', 'ALMACENISTA', 'RECEPCION']
  },
  {
    label: 'Asignaciones',
    route: '/asignaciones',
    icon: 'pi pi-send',
    description: 'Flujos de entrega de insumos a habitación y trazabilidad.',
    section: 'Operación',
    roles: ['ADMIN', 'ALMACENISTA', 'RECEPCION', 'SERVICIO']
  },
  {
    label: 'Reportes',
    route: '/reportes',
    icon: 'pi pi-chart-line',
    description: 'Reportes operativos y exportables según el rol autorizado.',
    section: 'Control',
    roles: ['ADMIN', 'RECEPCION']
  }
];
