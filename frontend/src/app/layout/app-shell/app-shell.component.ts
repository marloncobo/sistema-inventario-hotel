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
      right: 1.5rem;
      bottom: 1.5rem;
      z-index: 70;
      display: inline-flex;
      align-items: center;
      gap: 0.85rem;
      min-height: 4rem;
      padding: 0.7rem 1rem 0.7rem 0.75rem;
      border: 1px solid rgba(184, 137, 42, 0.22);
      border-radius: 999px;
      background:
        radial-gradient(circle at top left, rgba(255, 244, 217, 0.95), transparent 52%),
        linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(250, 241, 224, 0.96));
      color: #5b3d11;
      box-shadow: 0 18px 42px rgba(72, 51, 26, 0.14);
      cursor: pointer;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
    }

    .shell__assistant-fab:hover {
      transform: translateY(-2px);
      border-color: rgba(184, 137, 42, 0.34);
      box-shadow: 0 24px 48px rgba(72, 51, 26, 0.18);
    }

    .shell__assistant-fab:focus-visible {
      outline: none;
      box-shadow:
        0 0 0 4px rgba(200, 146, 45, 0.18),
        0 20px 46px rgba(72, 51, 26, 0.16);
    }

    .shell__assistant-fab-icon {
      width: 2.6rem;
      height: 2.6rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: linear-gradient(180deg, rgba(202, 154, 59, 0.95), rgba(164, 114, 24, 0.98));
      color: #fffdf8;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32);
      font-size: 1.1rem;
      flex: 0 0 auto;
    }

    .shell__assistant-fab-copy {
      display: grid;
      text-align: left;
      line-height: 1.1;
    }

    .shell__assistant-fab-copy strong {
      font-size: 0.92rem;
      font-weight: 800;
      color: #5b3d11;
    }

    .shell__assistant-fab-copy small {
      margin-top: 0.2rem;
      font-size: 0.72rem;
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
