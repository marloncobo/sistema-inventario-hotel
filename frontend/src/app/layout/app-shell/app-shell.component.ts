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
        <div class="shell__mobile-bar">
          <button
            type="button"
            class="shell__mobile-trigger"
            (click)="layout.toggleMobileMenu()"
            aria-label="Abrir menú"
          >
            <i class="pi pi-bars"></i>
          </button>
        </div>

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
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .shell__mobile-bar {
      display: none;
    }

    .shell__content {
      flex: 1 1 auto;
      min-height: calc(100vh - 3rem);
      padding: 0;
      background: transparent;
      overflow-x: hidden;
      min-width: 0;
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

    @media (min-width: 1024px) and (max-width: 1365px) {
      .shell {
        --shell-sidebar-width: 232px;
      }

      .shell--collapsed {
        --shell-sidebar-width: 84px;
      }

      .shell__main {
        padding: 1.1rem 1rem 1.25rem 0;
      }

      .shell__content {
        min-height: calc(100vh - 2.35rem);
      }
    }

    @media (max-width: 1023px) {
      .shell__main {
        margin-left: 0;
        padding: 0;
      }

      .shell__mobile-bar {
        display: flex;
        justify-content: flex-end;
        padding: 0.85rem 0.85rem 0;
      }

      .shell__mobile-trigger {
        display: grid;
        position: relative;
        top: auto;
        right: auto;
        margin-left: 0;
        z-index: 1;
      }

      .shell__content {
        margin-top: 0;
        padding: 0;
        min-height: calc(100vh - 2rem);
      }
    }

    @media (max-width: 640px) {
      .shell__mobile-bar {
        padding: 0.55rem 0.55rem 0;
      }

      .shell__mobile-trigger {
        width: 3rem;
        height: 3rem;
        border-radius: 0.9rem;
      }
    }
  `
})
export class AppShellComponent {
  protected readonly layout = inject(LayoutService);
}
