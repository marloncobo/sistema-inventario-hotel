import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import type { AuditFilters, AuditLog } from '@models/audit.model';
import { buildHttpParams } from './http-params.util';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getAuthAudit(filters: AuditFilters): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiBaseUrl}/auth/audit`, {
      params: buildHttpParams(filters)
    });
  }

  getInventoryAudit(filters: AuditFilters): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(
      `${this.apiBaseUrl}/inventory/api/inventory/audit`,
      {
        params: buildHttpParams(filters)
      }
    );
  }

  getRoomsAudit(filters: AuditFilters): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiBaseUrl}/rooms/api/rooms/audit`, {
      params: buildHttpParams(filters)
    });
  }
}
