import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '@core/services/auth.service';
import { LayoutService } from '@core/services/layout.service';
import { ROLE_LABELS } from '@models/role.model';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [BreadcrumbsComponent, ButtonModule, CommonModule],
  template: `
    <header class="topbar">
      <div class="topbar__left">
        <button
          pButton
          type="button"
          icon="pi pi-bars"
          severity="secondary"
          variant="text"
          aria-label="Abrir menú"
          class="topbar__mobile"
          (click)="layout.toggleMobileMenu()"
        ></button>

        <button
          pButton
          type="button"
          [icon]="layout.sidebarCollapsed() ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'"
          severity="secondary"
          variant="text"
          aria-label="Contraer menú"
          class="topbar__desktop"
          (click)="layout.toggleSidebar()"
        ></button>

        <div>
          <app-breadcrumbs />
          <h2 class="topbar__headline">Panel operativo</h2>
        </div>
      </div>

      <div class="topbar__user">
        <div class="topbar__identity">
          <strong>{{ authService.username() }}</strong>
          <span>{{ rolesLabel() }}</span>
        </div>

        <button
          pButton
          type="button"
          label="Salir"
          icon="pi pi-sign-out"
          severity="secondary"
          variant="outlined"
          (click)="authService.logout()"
        ></button>
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
      background: rgba(255, 255, 255, 0.84);
      backdrop-filter: blur(18px);
      border: 1px solid rgba(148, 163, 184, 0.14);
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.07);
    }

    .topbar__left,
    .topbar__user {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .topbar__mobile {
      display: none;
    }

    .topbar__headline {
      margin: 0.35rem 0 0;
      color: #0f172a;
      font-size: 1.1rem;
    }

    .topbar__identity {
      display: grid;
      text-align: right;
    }

    .topbar__identity strong {
      color: #0f172a;
      font-size: 0.95rem;
    }

    .topbar__identity span {
      color: #64748b;
      font-size: 0.8rem;
    }

    @media (max-width: 1023px) {
      .topbar {
        padding: 1rem;
      }

      .topbar__mobile {
        display: inline-flex;
      }

      .topbar__desktop {
        display: none;
      }

      .topbar__headline {
        font-size: 1rem;
      }

      .topbar__identity {
        display: none;
      }
    }
  `
})
export class TopbarComponent {
  protected readonly authService = inject(AuthService);
  protected readonly layout = inject(LayoutService);

  protected readonly rolesLabel = computed(() =>
    this.authService
      .roles()
      .map((role) => ROLE_LABELS[role])
      .join(' · ')
  );
}
