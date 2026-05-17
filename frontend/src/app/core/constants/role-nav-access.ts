import type { AppRole } from '@models/role.model';

/** Todas las rutas del shell con guard de rol. */
export const SHELL_ROUTES = [
  'dashboard',
  'asistente-ia',
  'usuarios',
  'auditoria',
  'catalogos',
  'inventario',
  'movimientos',
  'ubicaciones',
  'documentos',
  'par-habitaciones',
  'reposicion',
  'conteos',
  'diferencias',
  'alertas',
  'habitaciones',
  'habitaciones/consulta',
  'asignaciones',
  'reportes'
] as const;

export type ShellNavRoutePath = (typeof SHELL_ROUTES)[number];

/**
 * Única fuente de verdad: qué rutas puede abrir cada rol.
 * El menú lateral y `roleGuard` se derivan de aquí.
 */
export const ROUTES_BY_ROLE: Record<AppRole, readonly ShellNavRoutePath[]> = {
  ADMIN: SHELL_ROUTES,
  ALMACENISTA: [
    'dashboard',
    'asistente-ia',
    'catalogos',
    'inventario',
    'movimientos',
    'ubicaciones',
    'documentos',
    'par-habitaciones',
    'reposicion',
    'conteos',
    'alertas',
    'habitaciones/consulta'
  ],
  RECEPCION: ['dashboard', 'asistente-ia', 'habitaciones', 'habitaciones/consulta', 'reportes'],
  SERVICIO: [
    'dashboard',
    'asistente-ia',
    'inventario',
    'ubicaciones',
    'par-habitaciones',
    'reposicion',
    'habitaciones/consulta',
    'asignaciones'
  ]
};

/** Mapa inverso para `data.roles` en rutas y ítems del menú. */
export const SHELL_ROUTE_ROLES: Record<ShellNavRoutePath, AppRole[]> = SHELL_ROUTES.reduce(
  (acc, route) => {
    const roles = (Object.keys(ROUTES_BY_ROLE) as AppRole[]).filter((role) =>
      ROUTES_BY_ROLE[role].includes(route)
    );
    acc[route] = roles;
    return acc;
  },
  {} as Record<ShellNavRoutePath, AppRole[]>
);

export function rolesForShellRoute(path: ShellNavRoutePath): AppRole[] {
  return [...SHELL_ROUTE_ROLES[path]];
}

export function roleCanAccessRoute(role: AppRole, path: ShellNavRoutePath): boolean {
  return ROUTES_BY_ROLE[role].includes(path);
}

export const SIDEBAR_CATALOGOS_ADMIN_ROLES: AppRole[] = ['ADMIN'];
export const SIDEBAR_PROVEEDORES_NAV_ROLES: AppRole[] = ['ALMACENISTA'];
