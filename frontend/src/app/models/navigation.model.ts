import type { AppRole } from './role.model';

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  description: string;
  roles: AppRole[];
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export type NavigationCategoryId =
  | 'overview'
  | 'operations'
  | 'control'
  | 'analysis'
  | 'settings';

export interface NavigationCategory {
  id: NavigationCategoryId;
  label: string;
  shortLabel: string;
  icon: string;
  eyebrow: string;
  description: string;
  groups: NavigationGroup[];
}
