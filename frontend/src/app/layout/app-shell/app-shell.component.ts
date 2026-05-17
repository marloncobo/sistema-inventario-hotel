import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@core/services/auth.service';
import { LayoutService } from '@core/services/layout.service';
import { filter, startWith } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
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

      @if (showAssistantFab()) {
        <button
          type="button"
          class="shell__assistant-fab"
          (click)="openAssistant()"
          aria-label="Abrir asistente IA"
        >
          <span class="shell__assistant-fab-icon">
            <i class="pi pi-sparkles" aria-hidden="true"></i>
          </span>
          <span class="shell__assistant-fab-copy">
            <strong>Asistente IA</strong>
            <small>Pregunta al inventario</small>
          </span>
        </button>
      }
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

    .shell__assistant-fab {
      position: fixed;
      right: 1.25rem;
      bottom: 1.25rem;
      z-index: 70;
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      min-height: auto;
      padding: 0.5rem 0.85rem 0.5rem 0.5rem;
      border: 1px solid rgba(200, 146, 45, 0.22);
      border-radius: 999px;
      background: #fff;
      color: #5b3d11;
      box-shadow: 0 8px 28px rgba(61, 43, 31, 0.1);
      cursor: pointer;
      transition:
        box-shadow 0.2s ease,
        border-color 0.2s ease;
    }

    .shell__assistant-fab:hover {
      transform: translateY(-1px);
      border-color: rgba(200, 146, 45, 0.38);
      box-shadow: 0 12px 32px rgba(61, 43, 31, 0.12);
    }

    .shell__assistant-fab:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(200, 146, 45, 0.18);
    }

    .shell__assistant-fab-icon {
      width: 2.35rem;
      height: 2.35rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: linear-gradient(145deg, #c8922d, #9a6a18);
      color: #fffdf8;
      font-size: 0.95rem;
      flex: 0 0 auto;
    }

    .shell__assistant-fab-copy {
      display: grid;
      text-align: left;
      line-height: 1.15;
    }

    .shell__assistant-fab-copy strong {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #5b3d11;
    }

    .shell__assistant-fab-copy small {
      margin-top: 0.08rem;
      font-size: 0.6875rem;
      color: #8b6d3a;
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

      .shell__assistant-fab {
        right: 1rem;
        bottom: 1rem;
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

      .shell__assistant-fab {
        right: 0.75rem;
        bottom: 0.75rem;
        min-height: 3.4rem;
        padding: 0.55rem;
        border-radius: 1.1rem;
      }

      .shell__assistant-fab-copy {
        display: none;
      }

      .shell__assistant-fab-icon {
        width: 2.3rem;
        height: 2.3rem;
      }
    }
  `
})
export class AppShellComponent {
  protected readonly layout = inject(LayoutService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null)
    ),
    { initialValue: null }
  );

  protected readonly showAssistantFab = computed(() => {
    this.navigationEnd();
    return (
      this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'SERVICIO']) &&
      !this.router.url.startsWith('/asistente-ia')
    );
  });

  protected openAssistant(): void {
    this.router.navigate(['/asistente-ia']);
  }
}
