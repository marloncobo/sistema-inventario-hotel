import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <section class="page-header">
      <div>
        @if (eyebrow()) {
          <span class="page-header__eyebrow">{{ eyebrow() }}</span>
        }
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
      align-items: flex-end;
      padding-bottom: 2rem;
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--app-border);
    }

    .page-header__eyebrow {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      background: var(--app-gold-soft);
      color: var(--app-gold);
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }

    .page-header__title {
      margin: 0;
      color: var(--app-brown);
    }

    .page-header__subtitle {
      margin: 0.75rem 0 0;
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

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        padding-bottom: 1.5rem;
        margin-bottom: 2rem;
      }
      
      .page-header__actions {
        width: 100%;
        margin-top: 1rem;
      }
    }
  `
})
export class PageHeaderComponent {
  readonly eyebrow = input('Vista principal');
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
