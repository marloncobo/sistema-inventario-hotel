import type { AppRole } from './role.model';

export interface AppUser {
  id: number;
  username: string;
  email: string;
  roles: AppRole[];
  active: boolean;
}

export interface UserUpsertRequest {
  username: string;
  email: string;
  password: string | null;
  roles: AppRole[];
  active: boolean;
}
