import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [ButtonModule, EmptyStateComponent],
  template: `
    <div class="error-page">
      <app-empty-state
        icon="pi pi-map"
        title="La ruta solicitada no existe"
        message="La direccion solicitada no corresponde a ninguna vista disponible."
        actionLabel="Ir al dashboard"
        actionRoute="/dashboard"
      />
    </div>
  `,
  styles: `
    .error-page {
      max-width: 52rem;
      margin: 2rem auto;
    }
  `
})
export class NotFoundPageComponent {}
