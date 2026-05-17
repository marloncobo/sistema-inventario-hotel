import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AssistantApiService } from '@core/services/api/assistant-api.service';
import { AssistantPageComponent } from './assistant-page.component';

describe('AssistantPageComponent', () => {
  let assistantApiSpy: jasmine.SpyObj<AssistantApiService>;

  beforeEach(async () => {
    assistantApiSpy = jasmine.createSpyObj<AssistantApiService>('AssistantApiService', [
      'askInventoryAssistant'
    ]);

    await TestBed.configureTestingModule({
      imports: [AssistantPageComponent],
      providers: [{ provide: AssistantApiService, useValue: assistantApiSpy }]
    }).compileComponents();
  });

  it('should disable submit when the question is blank', () => {
    const fixture = TestBed.createComponent(AssistantPageComponent);
    const component = fixture.componentInstance;

    component['updateQuestion']('   ');

    expect(component['canSubmit']()).toBeFalse();
  });

  it('should send a valid question and append the successful answer to history', () => {
    assistantApiSpy.askInventoryAssistant.and.returnValue(
      of({
        answer: 'Prioriza shampoo y agua.',
        contextSource: 'inventory-service'
      })
    );

    const fixture = TestBed.createComponent(AssistantPageComponent);
    const component = fixture.componentInstance;

    component['updateQuestion']('¿Qué compras debería priorizar hoy?');
    component['askQuestion']();

    expect(assistantApiSpy.askInventoryAssistant).toHaveBeenCalledOnceWith(
      '¿Qué compras debería priorizar hoy?'
    );
    expect(component['history']().length).toBe(1);
    expect(component['history']()[0].status).toBe('success');
    expect(component['history']()[0].answer).toBe('Prioriza shampoo y agua.');
    expect(component['history']()[0].contextSource).toBe('inventory-service');
    expect(component['loading']()).toBeFalse();
  });

  it('should keep an error entry in history when the request fails', () => {
    assistantApiSpy.askInventoryAssistant.and.returnValue(
      throwError(() => ({
        error: {
          message: 'No fue posible consultar la IA en este momento.'
        }
      }))
    );

    const fixture = TestBed.createComponent(AssistantPageComponent);
    const component = fixture.componentInstance;

    component['updateQuestion']('¿Qué productos están bajos de stock?');
    component['askQuestion']();

    expect(component['submitError']()).toBe('No fue posible consultar la IA en este momento.');
    expect(component['history']().length).toBe(1);
    expect(component['history']()[0].status).toBe('error');
    expect(component['history']()[0].errorMessage).toBe(
      'No fue posible consultar la IA en este momento.'
    );
    expect(component['loading']()).toBeFalse();
  });
});
