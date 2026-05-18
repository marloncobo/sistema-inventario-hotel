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
  private readonly baseUrl = `${environment.apiBaseUrl}/ai`;

  askInventoryAssistant(question: string, conversationId?: number): Observable<InventoryAssistantResponse> {
    const payload: InventoryAssistantRequest = { question };
    let url = `${this.baseUrl}/inventory-assistant`;
    if (conversationId) {
      url += `?conversationId=${conversationId}`;
    }
    return this.http.post<InventoryAssistantResponse>(url, payload);
  }
}
