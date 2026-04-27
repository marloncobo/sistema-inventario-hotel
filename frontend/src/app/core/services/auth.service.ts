import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import type { KnownApiError } from '@models/api-error.model';
import { extractApiErrorMessage } from '@models/api-error.model';
import type { AppRole } from '@models/role.model';
import type { LoginRequest, LoginResponse, UserSession } from '@models/session.model';
import { catchError, map, Observable, tap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = environment.storageKey;
  private readonly sessionState = signal<UserSession | null>(this.readSession());

  readonly session = computed(() => this.sessionState());
  readonly roles = computed(() => this.sessionState()?.roles ?? []);
  readonly username = computed(() => this.sessionState()?.username ?? '');
  readonly primaryRole = computed<AppRole | null>(() => this.roles()[0] ?? null);

  login(payload: LoginRequest): Observable<UserSession> {
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload).pipe(
      map((response) => ({
        ...response,
        tokenType: response.tokenType || 'Bearer'
      })),
      tap((session) => this.persistSession(session)),
      catchError((error) => throwError(() => this.normalizeLoginError(error)))
    );
  }

  logout(redirectToLogin = true): void {
    this.sessionState.set(null);
    localStorage.removeItem(this.storage);

    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }

  isAuthenticated(): boolean {
    return this.sessionState() !== null;
  }

  getToken(): string | null {
    return this.sessionState()?.token ?? null;
  }

  getAuthorizationHeader(): string | null {
    const current = this.sessionState();
    if (!current) {
      return null;
    }

    return `${current.tokenType ?? 'Bearer'} ${current.token}`;
  }

  hasAnyRole(expectedRoles: AppRole[]): boolean {
    const currentRoles = this.roles();
    return expectedRoles.some((role) => currentRoles.includes(role));
  }

  hasRole(role: AppRole): boolean {
    return this.roles().includes(role);
  }

  private persistSession(session: UserSession): void {
    if (this.isExpired(session.expiresAt)) {
      this.logout(false);
      return;
    }

    this.sessionState.set(session);
    localStorage.setItem(this.storage, JSON.stringify(session));
  }

  private readSession(): UserSession | null {
    try {
      const raw = localStorage.getItem(this.storage);
      if (!raw) {
        return null;
      }

      const session = JSON.parse(raw) as UserSession;
      if (!session?.token || this.isExpired(session.expiresAt)) {
        localStorage.removeItem(this.storage);
        return null;
      }

      return session;
    } catch {
      localStorage.removeItem(this.storage);
      return null;
    }
  }

  private isExpired(expiresAt: string | null | undefined): boolean {
    if (!expiresAt) {
      return true;
    }

    return new Date(expiresAt).getTime() <= Date.now();
  }

  private normalizeLoginError(error: { error?: KnownApiError }): Error {
    return new Error(extractApiErrorMessage(error.error));
  }
}
