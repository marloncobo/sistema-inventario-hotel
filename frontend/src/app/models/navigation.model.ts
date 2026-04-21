import type { AppRole } from './role.model';

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  description: string;
  section: 'Principal' | 'Operación' | 'Control' | 'Configuración';
  roles: AppRole[];
}
