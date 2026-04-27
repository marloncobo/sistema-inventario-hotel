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
      position: relative;
      overflow: hidden;
      display: grid;
      gap: 1rem;
      justify-items: center;
      text-align: center;
      width: 100%;
      padding: 2.15rem;
      border: 1px solid rgba(200, 146, 45, 0.28);
      border-radius: 1.5rem;
      background:
        radial-gradient(circle at top, rgba(230, 189, 106, 0.18), transparent 38%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.99), rgba(255, 252, 245, 0.98) 58%, rgba(248, 238, 216, 0.96));
      box-shadow: 0 18px 38px rgba(61, 43, 31, 0.06);
    }

    .empty-state::before {
      content: '';
      position: absolute;
      inset: 0 0 auto;
      height: 0.22rem;
      background: linear-gradient(90deg, rgba(200, 146, 45, 0.35), var(--app-gold), rgba(230, 189, 106, 0.72));
    }

    .empty-state__icon {
      width: 4rem;
      height: 4rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      background: linear-gradient(135deg, rgba(200, 146, 45, 0.16), rgba(230, 189, 106, 0.3));
      box-shadow: inset 0 0 0 1px rgba(200, 146, 45, 0.12);
      color: #9a670d;
      font-size: 1.5rem;
    }

    .empty-state h3 {
      margin: 0;
      color: #8f6817;
      font-size: 1.25rem;
    }

    .empty-state p {
      margin: 0;
      max-width: 34rem;
      color: #8a735c;
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
