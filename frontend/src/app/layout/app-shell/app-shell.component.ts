import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
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
    <div class="shell">
      <app-sidebar />

      <main class="shell__main">
        <app-topbar />

        <section class="shell__content">
          <router-outlet />
        </section>
      </main>
    </div>
  `,
  styles: `
    .shell {
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(45, 212, 191, 0.12), transparent 26%),
        radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.12), transparent 24%),
        linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%);
    }

    .shell__main {
      margin-left: 21rem;
      padding: 1rem 1rem 2rem;
      transition: margin-left 0.2s ease;
    }

    .shell__content {
      margin-top: 1rem;
      padding: 1.5rem;
      min-height: calc(100vh - 8rem);
      border-radius: 2rem;
      background: rgba(255, 255, 255, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.75);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
    }

    @media (max-width: 1023px) {
      .shell__main {
        margin-left: 0;
      }

      .shell__content {
        padding: 1rem;
        border-radius: 1.5rem;
      }
    }
  `
})
export class AppShellComponent {}
