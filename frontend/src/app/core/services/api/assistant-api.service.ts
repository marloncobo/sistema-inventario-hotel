import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import type {
  InventoryAssistantRequest,
  InventoryAssistantResponse
} from '@models/assistant.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AssistantApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ai/api/ai`;

  askInventoryAssistant(question: string): Observable<InventoryAssistantResponse> {
    const payload: InventoryAssistantRequest = { question };
    return this.http.post<InventoryAssistantResponse>(
      `${this.baseUrl}/inventory-assistant`,
      payload
    );
  }
}
