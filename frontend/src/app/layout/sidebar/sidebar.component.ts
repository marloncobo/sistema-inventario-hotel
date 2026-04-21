import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { APP_NAV_ITEMS } from '@core/constants/navigation';
import { AuthService } from '@core/services/auth.service';
import { LayoutService } from '@core/services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    @if (layout.mobileMenuOpen()) {
      <button
        type="button"
        class="sidebar-backdrop"
        (click)="layout.closeMobileMenu()"
        aria-label="Cerrar menú"
      ></button>
    }

    <aside
      class="sidebar"
      [class.sidebar--collapsed]="layout.sidebarCollapsed()"
      [class.sidebar--mobile-open]="layout.mobileMenuOpen()"
    >
      <div class="sidebar__brand">
        <div class="sidebar__mark">HI</div>
        @if (!layout.sidebarCollapsed()) {
          <div>
            <strong>Hotel Inventario</strong>
            <p>Panel administrativo</p>
          </div>
        }
      </div>

      @for (section of sections; track section) {
        <section class="sidebar__section">
          @if (!layout.sidebarCollapsed()) {
            <span class="sidebar__section-title">{{ section }}</span>
          }

          <nav class="sidebar__nav">
            @for (item of navItemsBySection(section); track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="sidebar__link--active"
                class="sidebar__link"
                (click)="layout.closeMobileMenu()"
              >
                <i [class]="item.icon"></i>

                @if (!layout.sidebarCollapsed()) {
                  <span>
                    <strong>{{ item.label }}</strong>
                    <small>{{ item.description }}</small>
                  </span>
                }
              </a>
            }
          </nav>
        </section>
      }
    </aside>
  `,
  styles: `
    :host {
      display: contents;
    }

    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.35);
      z-index: 40;
    }

    .sidebar {
      position: fixed;
      inset: 1rem auto 1rem 1rem;
      width: 18rem;
      padding: 1rem;
      border-radius: 1.5rem;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.94));
      color: white;
      display: grid;
      gap: 1.5rem;
      align-content: start;
      box-shadow: 0 28px 60px rgba(15, 23, 42, 0.28);
      z-index: 50;
      transition: width 0.2s ease, transform 0.2s ease;
    }

    .sidebar--collapsed {
      width: 5.5rem;
    }

    .sidebar__brand {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      padding: 0.35rem;
    }

    .sidebar__brand strong {
      display: block;
      font-size: 0.95rem;
    }

    .sidebar__brand p {
      margin: 0.15rem 0 0;
      color: rgba(226, 232, 240, 0.7);
      font-size: 0.78rem;
    }

    .sidebar__mark {
      width: 2.8rem;
      height: 2.8rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      background: linear-gradient(135deg, #14b8a6, #22c55e);
      color: #052e2b;
      font-weight: 800;
      letter-spacing: 0.06em;
    }

    .sidebar__section {
      display: grid;
      gap: 0.75rem;
    }

    .sidebar__section-title {
      color: rgba(148, 163, 184, 0.85);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding-left: 0.35rem;
    }

    .sidebar__nav {
      display: grid;
      gap: 0.45rem;
    }

    .sidebar__link {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.85rem 0.9rem;
      border-radius: 1rem;
      color: rgba(226, 232, 240, 0.92);
      text-decoration: none;
      transition: background 0.2s ease, transform 0.2s ease;
    }

    .sidebar__link:hover {
      background: rgba(45, 212, 191, 0.12);
      transform: translateX(2px);
    }

    .sidebar__link i {
      font-size: 1.1rem;
      min-width: 1.25rem;
    }

    .sidebar__link span {
      display: grid;
      gap: 0.15rem;
    }

    .sidebar__link strong {
      font-size: 0.9rem;
      font-weight: 700;
    }

    .sidebar__link small {
      color: rgba(203, 213, 225, 0.72);
      font-size: 0.74rem;
      line-height: 1.35;
    }

    .sidebar__link--active {
      background: rgba(20, 184, 166, 0.18);
      color: white;
      box-shadow: inset 0 0 0 1px rgba(94, 234, 212, 0.18);
    }

    @media (max-width: 1023px) {
      .sidebar {
        transform: translateX(-120%);
      }

      .sidebar--mobile-open {
        transform: translateX(0);
      }
    }
  `
})
export class SidebarComponent {
  protected readonly layout = inject(LayoutService);
  private readonly authService = inject(AuthService);

  protected readonly sections = ['Principal', 'Operación', 'Control', 'Configuración'] as const;
  protected readonly navItems = computed(() =>
    APP_NAV_ITEMS.filter((item) => this.authService.hasAnyRole(item.roles))
  );

  protected navItemsBySection(section: (typeof this.sections)[number]) {
    return this.navItems().filter((item) => item.section === section);
  }
}
