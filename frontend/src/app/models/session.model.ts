import type { AppRole } from './role.model';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresAt: string;
  username: string;
  roles: AppRole[];
}

export interface UserSession extends LoginResponse {}
