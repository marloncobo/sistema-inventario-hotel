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
        eyebrow="Fase 2"
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
            Esta seccion ya cuenta con estructura, permisos y espacio reservado dentro del sistema.
            Las acciones y tablas finales se completaran en la siguiente fase.
          </p>
        </article>

        <article class="placeholder-card">
          <h3>Nota operativa</h3>
          <p>{{ note }}</p>
        </article>
      </section>

      <app-empty-state
        icon="pi pi-cog"
        title="Modulo preparado para crecer"
        message="La navegacion y los permisos ya estan listos. En la siguiente fase se incorporaran formularios, tablas, filtros y exportaciones para esta seccion."
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
  protected readonly note = this.route.snapshot.data['note'] as string;
}
