import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { LayoutService } from '@core/services/layout.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    ToastModule,
    ConfirmDialogModule
  ],
  template: `
    <p-toast position="top-right" />
    <p-confirmdialog />
    <div class="shell" [class.shell--collapsed]="layout.sidebarCollapsed()">
      <app-sidebar />

      <main class="shell__main">
        <!-- Mobile Trigger (Since Topbar is gone) -->
        <button
          type="button"
          class="shell__mobile-trigger"
          (click)="layout.toggleMobileMenu()"
          aria-label="Abrir menu"
        >
          <i class="pi pi-bars"></i>
        </button>

        <section class="shell__content">
          <router-outlet />
        </section>
      </main>
    </div>
  `,
  styles: `
    .shell {
      --shell-sidebar-width: 260px;
      min-height: 100vh;
      background: #ffffff;
      position: relative;
    }



    .shell--collapsed {
      --shell-sidebar-width: 80px;
    }

    .shell__main {
      margin-left: var(--shell-sidebar-width);
      padding: 1.5rem 1.5rem 1.5rem 0; /* Breathable spacing from sidebar */
      transition: margin-left 0.38s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    .shell__content {
      min-height: calc(100vh - 3rem);
      padding: 0;
      background: transparent;
      overflow-x: hidden;
    }

    .shell__mobile-trigger {
      display: none;
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 50;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 1rem;
      background: white;
      border: 1px solid var(--app-border);
      color: var(--app-gold);
      font-size: 1.4rem;
      place-items: center;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
      transition: all 0.2s;
    }

    .shell__mobile-trigger:active {
      transform: scale(0.95);
    }

    @media (max-width: 1023px) {
      .shell__main {
        margin-left: 0;
        padding: 0.75rem;
      }

      .shell__mobile-trigger {
        display: grid;
      }

      .shell__content {
        margin-top: 4.5rem;
        padding: 1.25rem;
        border-radius: 1.25rem;
        min-height: calc(100vh - 6rem);
      }
    }
  `
})
export class AppShellComponent {
  protected readonly layout = inject(LayoutService);
}
