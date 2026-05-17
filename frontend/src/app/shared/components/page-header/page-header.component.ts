import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <section class="page-header">
      <div>
        <h1 class="page-header__title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-header__subtitle">{{ subtitle() }}</p>
        }
      </div>

      <div class="page-header__actions">
        <ng-content select="[header-actions]" />
      </div>
    </section>
  `,
  styles: `
    .page-header {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0;
      margin-bottom: 0;
      border-bottom: none;
    }

    .page-header__title {
      margin: 0;
      font-family: var(--app-font-serif, 'Playfair Display', serif);
      font-size: 2.75rem;
      font-weight: 700;
      line-height: 1;
      color: var(--app-brown);
      letter-spacing: -0.02em;
    }

    .page-header__subtitle {
      margin: 0.55rem 0 0;
      max-width: 42rem;
      color: #6b5a4a;
      font-size: 1.05rem;
      line-height: 1.5;
      font-weight: 500;
    }

    .page-header__actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    @media (max-width: 960px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .page-header__actions {
        justify-content: flex-start;
      }
    }

    @media (max-width: 720px) {
      .page-header__title {
        font-size: 2.1rem;
      }

      .page-header__actions {
        width: 100%;
      }
    }
  `
})
export class PageHeaderComponent {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
