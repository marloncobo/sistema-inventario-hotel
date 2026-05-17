import type { AppRole } from '@models/role.model';
import { ROUTES_BY_ROLE, type ShellNavRoutePath } from './role-nav-access';

export function roleCanAccessRoute(role: AppRole, route: ShellNavRoutePath): boolean {
  return ROUTES_BY_ROLE[role].includes(route);
}

export const ROLE_SUMMARY: Record<AppRole, string> = {
  ADMIN: 'Configuración, bodega, habitaciones y reportes completos.',
  ALMACENISTA: 'Bodega y PAR; repone con transferencias, no entrega en habitación.',
  SERVICIO: 'Entregas y devoluciones en habitación; consulta inventario sin bodega.',
  RECEPCION: 'Habitaciones, consulta con PAR integrado y reportes; sin bodega.'
};
