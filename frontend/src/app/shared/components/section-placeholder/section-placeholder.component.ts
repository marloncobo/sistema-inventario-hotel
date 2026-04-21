import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { PageHeaderComponent } from '../page-header/page-header.component';

@Component({
  selector: 'app-section-placeholder',
  standalone: true,
  imports: [ButtonModule, EmptyStateComponent, PageHeaderComponent, RouterLink],
  template: `
    <div class="space-y-8">
      <app-page-header
        eyebrow="Proximamente"
        [title]="title"
        [subtitle]="summary"
      >
        <div header-actions>
          <a
            pButton
            routerLink="/dashboard"
            label="Volver al dashboard"
            severity="secondary"
            variant="outlined"
          ></a>
        </div>
      </app-page-header>

      <section class="placeholder-grid">
        <article class="placeholder-card">
          <h3>Estado actual</h3>
          <p>
            Esta seccion se encuentra en preparacion. Proximamente tendra formularios, tablas y
            acciones completas dentro del sistema.
          </p>
        </article>

        <article class="placeholder-card">
          <h3>Proximo avance</h3>
          <p>Se agregaran herramientas de gestion y consulta orientadas al uso diario.</p>
        </article>

        <article class="placeholder-card">
          <h3>Disponibilidad</h3>
          <p>Mientras tanto, puedes continuar usando los modulos ya habilitados.</p>
        </article>
      </section>

      <app-empty-state
        icon="pi pi-cog"
        title="Modulo en preparacion"
        message="Esta seccion estara disponible en una proxima actualizacion."
      />
    </div>
  `,
  styles: `
    .placeholder-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    }

    .placeholder-card {
      padding: 1.5rem;
      border-radius: 1.5rem;
      background: white;
      border: 1px solid rgba(148, 163, 184, 0.18);
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
    }

    .placeholder-card h3 {
      margin: 0 0 0.75rem;
      color: #0f172a;
      font-size: 1rem;
    }

    .placeholder-card p {
      margin: 0;
      color: #475569;
      line-height: 1.6;
    }
  `
})
export class SectionPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = this.route.snapshot.data['title'] as string;
  protected readonly summary = this.route.snapshot.data['summary'] as string;
}
