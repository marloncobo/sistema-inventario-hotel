import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import type { AppUser, UserUpsertRequest } from '@models/app-user.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth/users`;

  getUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(this.baseUrl);
  }

  createUser(payload: UserUpsertRequest): Observable<AppUser> {
    return this.http.post<AppUser>(this.baseUrl, payload);
  }

  updateUser(id: number, payload: UserUpsertRequest): Observable<AppUser> {
    return this.http.put<AppUser>(`${this.baseUrl}/${id}`, payload);
  }
}
