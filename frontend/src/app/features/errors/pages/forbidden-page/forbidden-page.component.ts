import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '@core/services/auth.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-forbidden-page',
  standalone: true,
  imports: [ButtonModule, RouterLink, EmptyStateComponent],
  template: `
    <div class="error-page">
      <app-empty-state
        icon="pi pi-lock"
        title="No tienes permisos para esta vista"
        message="Tu perfil no tiene acceso a esta vista."
      />

      <div class="error-page__actions">
        <a pButton routerLink="/dashboard" label="Volver al dashboard"></a>
        <button
          pButton
          type="button"
          label="Cerrar sesion"
          severity="secondary"
          variant="outlined"
          (click)="authService.logout()"
        ></button>
      </div>
    </div>
  `,
  styles: `
    .error-page {
      display: grid;
      gap: 1.5rem;
      max-width: 52rem;
      margin: 2rem auto;
    }

    .error-page__actions {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
  `
})
export class ForbiddenPageComponent {
  protected readonly authService = inject(AuthService);
}
