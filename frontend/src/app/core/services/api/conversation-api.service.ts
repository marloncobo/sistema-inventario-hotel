import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface ConversationDto {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessageDto[];
}

export interface ConversationMessageDto {
  id: number;
  question: string;
  answer: string;
  createdAt: string;
  userRole: string;
}

@Injectable({ providedIn: 'root' })
export class ConversationApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/ai`;

  getConversations(): Observable<ConversationDto[]> {
    return this.http.get<ConversationDto[]>(`${this.apiUrl}/conversations`);
  }

  getConversation(id: number): Observable<ConversationDto> {
    return this.http.get<ConversationDto>(`${this.apiUrl}/conversations/${id}`);
  }

  createConversation(title: string): Observable<ConversationDto> {
    return this.http.post<ConversationDto>(`${this.apiUrl}/conversations`, { title });
  }

  deleteConversation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/conversations/${id}`);
  }

  updateConversationTitle(id: number, title: string): Observable<ConversationDto> {
    return this.http.put<ConversationDto>(`${this.apiUrl}/conversations/${id}`, { title });
  }
}
