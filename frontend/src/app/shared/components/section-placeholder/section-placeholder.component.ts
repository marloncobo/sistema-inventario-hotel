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
            La base técnica de esta sección ya está registrada en routing, guards por rol,
            layout común e integración JWT. La implementación CRUD y tablas finales se
            completará en la siguiente fase sin tocar el backend.
          </p>
        </article>

        <article class="placeholder-card">
          <h3>Contrato backend a respetar</h3>
          <p>{{ endpoint }}</p>
        </article>

        <article class="placeholder-card">
          <h3>Nota operativa</h3>
          <p>{{ note }}</p>
        </article>
      </section>

      <app-empty-state
        icon="pi pi-cog"
        title="Módulo preparado para crecer"
        message="La base ya reconoce permisos, navegación y estructura de feature. En Fase 3 se conectarán formularios, tablas, filtros y exportaciones reales contra el gateway existente."
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
  protected readonly endpoint = this.route.snapshot.data['endpoint'] as string;
  protected readonly note = this.route.snapshot.data['note'] as string;
}
