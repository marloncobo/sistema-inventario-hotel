import type { AppRole } from './role.model';

export interface AppUser {
  id: number;
  username: string;
  roles: AppRole[];
  active: boolean;
}

export interface UserUpsertRequest {
  username: string;
  password: string | null;
  roles: AppRole[];
  active: boolean;
}
