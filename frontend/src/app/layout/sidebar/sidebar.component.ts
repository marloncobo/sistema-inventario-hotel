import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { APP_NAV_CATEGORIES } from '@core/constants/navigation';
import { AuthService } from '@core/services/auth.service';
import { LayoutService } from '@core/services/layout.service';
import { filter, startWith } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
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

  // Identity
  protected readonly username = this.authService.username;

  // Filtered Navigation
  protected readonly navCategories = computed(() =>
    APP_NAV_CATEGORIES.map((category) => ({
      ...category,
      groups: category.groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => this.authService.hasAnyRole(item.roles))
        }))
        .filter((group) => group.items.length > 0)
    })).filter((category) => category.groups.length > 0)
  );

  protected closeSidebar(): void {
    if (this.layout.mobileMenuOpen()) {
      this.layout.closeMobileMenu();
    }
  }

  protected logout(): void {
    this.authService.logout();
  }
}
