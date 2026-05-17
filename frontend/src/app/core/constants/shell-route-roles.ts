import type { AppRole } from '@models/role.model';

/**
 * Única fuente de roles por vista del shell (misma lista que `data.roles` en `roleGuard`).
 * El sidebar debe usar estos mismos valores para no mostrar rutas no autorizadas.
 *
 * Modelo operativo hotel:
 * - ADMIN: configuración, aprobaciones y reportes globales.
 * - ALMACENISTA: bodega (documentos, conteos, transferencias); no entrega en habitación.
 * - SERVICIO: habitación (asignaciones, devoluciones, PAR lectura); sin bodega operativa.
 * - RECEPCION: habitaciones, PAR comparado y reportes; sin inventario operativo.
 */
export const SHELL_ROUTE_ROLES = {
  dashboard: ['ADMIN', 'ALMACENISTA', 'RECEPCION', 'SERVICIO'],
  'asistente-ia': ['ADMIN', 'ALMACENISTA', 'RECEPCION', 'SERVICIO'],
  usuarios: ['ADMIN'],
  auditoria: ['ADMIN'],
  catalogos: ['ADMIN', 'ALMACENISTA'],
  /** Consulta de insumos y devoluciones (servicio); operaciones de bodega admin/almacén. */
  inventario: ['ADMIN', 'ALMACENISTA', 'SERVICIO'],
  movimientos: ['ADMIN', 'ALMACENISTA'],
  ubicaciones: ['ADMIN', 'ALMACENISTA', 'SERVICIO'],
  documentos: ['ADMIN', 'ALMACENISTA'],
  'par-habitaciones': ['ADMIN', 'ALMACENISTA', 'SERVICIO', 'RECEPCION'],
  reposicion: ['ADMIN', 'ALMACENISTA', 'SERVICIO'],
  conteos: ['ADMIN', 'ALMACENISTA'],
  diferencias: ['ADMIN'],
  alertas: ['ADMIN', 'ALMACENISTA'],
  habitaciones: ['ADMIN', 'RECEPCION', 'SERVICIO'],
  'habitaciones/consulta': ['ADMIN', 'ALMACENISTA', 'RECEPCION', 'SERVICIO'],
  /** Entrega física en habitación: housekeeping y administración. */
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
