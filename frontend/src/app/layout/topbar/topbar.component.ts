import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LayoutService } from '@core/services/layout.service';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [BreadcrumbsComponent, CommonModule],
  template: `
    <header class="topbar">
      <div class="topbar__left">
        <div class="topbar__actions">
          <button
            type="button"
            class="topbar__icon-button topbar__mobile"
            aria-label="Abrir menu"
            (click)="layout.toggleMobileMenu()"
          >
            <i class="pi pi-bars" aria-hidden="true"></i>
          </button>

          <button
            type="button"
            class="topbar__icon-button topbar__desktop"
            [attr.aria-label]="layout.sidebarCollapsed() ? 'Expandir menu' : 'Contraer menu'"
            (click)="layout.toggleSidebar()"
          >
            <i
              class="pi"
              [class.pi-angle-double-right]="layout.sidebarCollapsed()"
              [class.pi-angle-double-left]="!layout.sidebarCollapsed()"
              aria-hidden="true"
            ></i>
          </button>
        </div>

        <div class="topbar__copy">
          <span class="topbar__eyebrow">Centro operativo</span>
          <app-breadcrumbs />
          <h2 class="topbar__headline">Hotel Lunara</h2>
        </div>
      </div>
    </header>
  `,
  styles: `
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-radius: 1.5rem;
      background: rgba(255, 250, 236, 0.92);
      backdrop-filter: blur(18px);
      border: 1px solid rgba(191, 140, 37, 0.14);
      box-shadow: 0 18px 45px rgba(101, 67, 33, 0.08);
    }

    .topbar__left,
    .topbar__actions {
      display: flex;
      align-items: center;
      gap: 0.9rem;
    }

    .topbar__icon-button {
      border: 1px solid rgba(214, 191, 152, 0.38);
      border-radius: 1rem;
      cursor: pointer;
      width: 2.9rem;
      height: 2.9rem;
      display: grid;
      place-items: center;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 249, 241, 0.95));
      color: #9b6f1f;
      box-shadow: 0 10px 24px rgba(192, 146, 45, 0.12);
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease,
        background-color 0.2s ease;
    }

    .topbar__icon-button:hover {
      transform: translateY(-1px);
      border-color: rgba(200, 146, 45, 0.42);
      box-shadow: 0 14px 28px rgba(192, 146, 45, 0.16);
    }

    .topbar__mobile {
      display: none;
    }

    .topbar__copy {
      min-width: 0;
    }

    .topbar__eyebrow {
      display: inline-block;
      margin-bottom: 0.1rem;
      color: #b17e29;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    .topbar__headline {
      margin: 0.35rem 0 0;
      color: #5b3d11;
      font-size: 1.1rem;
      font-family: 'Palatino Linotype', 'Book Antiqua', Georgia, serif;
    }

    @media (max-width: 1023px) {
      .topbar {
        padding: 1rem;
      }

      .topbar__mobile {
        display: grid;
      }

      .topbar__desktop {
        display: none;
      }

      .topbar__headline {
        font-size: 1rem;
      }
    }
  `
})
export class TopbarComponent {
  protected readonly layout = inject(LayoutService);
}
