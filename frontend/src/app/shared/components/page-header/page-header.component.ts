import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <section class="page-header">
      <div>
        <span class="page-header__eyebrow">{{ eyebrow() }}</span>
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
      gap: 1rem;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(191, 140, 37, 0.14);
    }

    .page-header__eyebrow {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.625rem;
      border-radius: 999px;
      background: rgba(245, 158, 11, 0.12);
      color: #9a670d;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .page-header__title {
      margin: 0.75rem 0 0;
      font-size: clamp(1.8rem, 3vw, 2.5rem);
      line-height: 1.05;
      color: #5b3d11;
      font-family: 'Palatino Linotype', 'Book Antiqua', Georgia, serif;
    }

    .page-header__subtitle {
      margin: 0.75rem 0 0;
      max-width: 60rem;
      color: #7a6130;
      font-size: 0.98rem;
    }

    .page-header__actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
  `
})
export class PageHeaderComponent {
  readonly eyebrow = input('Vista principal');
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
