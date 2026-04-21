import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { LayoutService } from '@core/services/layout.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    ToastModule,
    ConfirmDialogModule,
    TopbarComponent
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
      background:
        radial-gradient(circle at top center, rgba(222, 187, 125, 0.16), transparent 24rem),
        radial-gradient(circle at 12% 88%, rgba(239, 214, 173, 0.16), transparent 18rem),
        linear-gradient(180deg, #fffefb 0%, #fbf7ef 100%);
    }

    .shell--collapsed {
      --shell-sidebar-width: 80px;
    }

    .shell__main {
      margin-left: var(--shell-sidebar-width);
      padding: 1.5rem;
      transition: margin-left 0.38s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    .shell__content {
      min-height: calc(100vh - 3rem);
      border-radius: 2rem;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 250, 244, 0.86));
      border: 1px solid rgba(214, 191, 152, 0.28);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.55),
        0 18px 45px rgba(177, 134, 67, 0.08);
      backdrop-filter: blur(14px);
    }

    .shell__mobile-trigger {
      display: none;
      position: fixed;
      top: 1.2rem;
      left: 1.2rem;
      z-index: 50;
      width: 3rem;
      height: 3rem;
      border-radius: 1rem;
      background: white;
      border: 1px solid rgba(214, 191, 152, 0.3);
      color: #c8922d;
      font-size: 1.2rem;
      place-items: center;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(0,0,0,0.05);
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
        margin-top: 4rem; /* Space for trigger */
        padding: 1rem;
        border-radius: 1.5rem;
      }
    }
  `
})
export class AppShellComponent {
  protected readonly layout = inject(LayoutService);
}
