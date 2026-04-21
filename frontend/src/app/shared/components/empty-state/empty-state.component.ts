import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [ButtonModule, RouterLink],
  template: `
    <article class="empty-state">
      <div class="empty-state__icon">
        <i [class]="icon()"></i>
      </div>
      <h3>{{ title() }}</h3>
      <p>{{ message() }}</p>

      @if (actionLabel() && actionRoute()) {
        <a pButton [routerLink]="actionRoute()!" [label]="actionLabel()!" size="small"></a>
      }
    </article>
  `,
  styles: `
    .empty-state {
      display: grid;
      gap: 1rem;
      justify-items: center;
      text-align: center;
      padding: 2rem;
      border: 1px dashed rgba(14, 116, 144, 0.25);
      border-radius: 1.5rem;
      background: linear-gradient(180deg, rgba(248, 250, 252, 0.95), rgba(240, 249, 255, 0.95));
    }

    .empty-state__icon {
      width: 4rem;
      height: 4rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      background: rgba(14, 116, 144, 0.1);
      color: #0f766e;
      font-size: 1.5rem;
    }

    .empty-state h3 {
      margin: 0;
      color: #0f172a;
      font-size: 1.25rem;
    }

    .empty-state p {
      margin: 0;
      max-width: 34rem;
      color: #475569;
    }
  `
})
export class EmptyStateComponent {
  readonly icon = input('pi pi-inbox');
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly actionLabel = input<string | null>(null);
  readonly actionRoute = input<string | null>(null);
}
