import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { AssistantApiService } from './assistant-api.service';

describe('AssistantApiService', () => {
  let service: AssistantApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AssistantApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should post the question to the inventory assistant endpoint', () => {
    const responseBody = {
      answer: 'Resumen generado por IA',
      contextSource: 'inventory-service'
    };

    service.askInventoryAssistant('¿Qué alertas están abiertas?').subscribe((response) => {
      expect(response).toEqual(responseBody);
    });

    const request = httpMock.expectOne(
      `${environment.apiBaseUrl}/ai/api/ai/inventory-assistant`
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      question: '¿Qué alertas están abiertas?'
    });

    request.flush(responseBody);
  });
});
