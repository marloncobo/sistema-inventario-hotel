import type { AppRole } from '@models/role.model';

/**
 * Única fuente de roles por vista del shell (misma lista que `data.roles` en `roleGuard`).
 * El sidebar debe usar estos mismos valores para no mostrar rutas no autorizadas.
 */
export const SHELL_ROUTE_ROLES = {
  dashboard: ['ADMIN', 'ALMACENISTA', 'RECEPCION', 'SERVICIO'],
  usuarios: ['ADMIN'],
  auditoria: ['ADMIN'],
  catalogos: ['ADMIN', 'ALMACENISTA'],
  inventario: ['ADMIN', 'ALMACENISTA', 'SERVICIO'],
  movimientos: ['ADMIN', 'ALMACENISTA'],
  alertas: ['ADMIN', 'ALMACENISTA'],
  habitaciones: ['ADMIN', 'RECEPCION', 'SERVICIO'],
  /** GET /rooms/number/{n}: mismo alcance que el gateway (todos los roles activos). */
  'habitaciones/consulta': ['ADMIN', 'RECEPCION', 'SERVICIO'],
  asignaciones: ['ADMIN', 'SERVICIO'],
  reportes: ['ADMIN', 'RECEPCION']
} as const satisfies Record<string, readonly AppRole[]>;

export type ShellNavRoutePath = keyof typeof SHELL_ROUTE_ROLES;

export function rolesForShellRoute(path: ShellNavRoutePath): AppRole[] {
  return [...SHELL_ROUTE_ROLES[path]];
}

/**
 * Misma ruta `/catalogos` para ADMIN y ALMACENISTA, pero entradas distintas en el menú
 * (evita dos enlaces para el administrador).
 */
export const SIDEBAR_CATALOGOS_ADMIN_ROLES: AppRole[] = ['ADMIN'];
export const SIDEBAR_PROVEEDORES_NAV_ROLES: AppRole[] = ['ALMACENISTA'];
