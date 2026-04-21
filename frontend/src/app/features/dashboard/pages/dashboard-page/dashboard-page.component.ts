import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { APP_NAV_ITEMS } from '@core/constants/navigation';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { RoomsApiService } from '@core/services/api/rooms-api.service';
import { UsersApiService } from '@core/services/api/users-api.service';
import { AuthService } from '@core/services/auth.service';
import type { AppUser } from '@models/app-user.model';
import type { LowStockAlert, SupplyItem } from '@models/inventory.model';
import type { Room } from '@models/room.model';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

interface DashboardMetricCard {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone: 'emerald' | 'amber' | 'sky' | 'slate';
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    ProgressSpinnerModule,
    EmptyStateComponent,
    PageHeaderComponent
  ],
  template: `
    <div class="space-y-8">
      <app-page-header
        eyebrow="Resumen del día"
        title="Panorama Luna"
        subtitle="Una vista rápida del estado operativo para el equipo del hotel."
      >
        <div header-actions>
          <a
            pButton
            routerLink="/inventario"
            label="Ir a inventario"
            icon="pi pi-arrow-right"
            iconPos="right"
          ></a>
        </div>
      </app-page-header>

      @if (loading()) {
        <section class="dashboard-loading">
          <p-progress-spinner strokeWidth="4" animationDuration=".7s" />
          <p>Cargando la operación del hotel...</p>
        </section>
      } @else {
        <section class="dashboard-grid">
          @for (card of metrics(); track card.label) {
            <article class="metric-card" [attr.data-tone]="card.tone">
              <div class="metric-card__icon">
                <i [class]="card.icon"></i>
              </div>

              <div>
                <span>{{ card.label }}</span>
                <strong>{{ card.value }}</strong>
                <small>{{ card.helper }}</small>
              </div>
            </article>
          }
        </section>

        <section class="dashboard-columns">
          <article class="card-surface">
            <h3>Accesos rápidos</h3>
            <div class="quick-actions">
              @for (item of quickActions(); track item.route) {
                <a [routerLink]="item.route" class="quick-actions__item">
                  <i [class]="item.icon"></i>
                  <span>
                    <strong>{{ item.label }}</strong>
                    <small>{{ item.description }}</small>
                  </span>
                </a>
              }
            </div>
          </article>
        </section>

        @if (!metrics().length) {
          <app-empty-state
            icon="pi pi-chart-bar"
            title="Sin métricas para mostrar"
            message="Aún no hay datos suficientes para este perfil, pero la operación principal ya está disponible."
          />
        }
      }
    </div>
  `,
  styles: `
    .dashboard-loading {
      display: grid;
      justify-items: center;
      gap: 1rem;
      padding: 3rem;
      color: #7a6130;
    }

    .dashboard-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    }

    .metric-card {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1rem;
      align-items: center;
      padding: 1.4rem;
      border-radius: 1.6rem;
      background: rgba(255, 251, 239, 0.96);
      border: 1px solid rgba(191, 140, 37, 0.18);
      box-shadow: 0 24px 45px rgba(101, 67, 33, 0.08);
    }

    .metric-card__icon {
      width: 3.2rem;
      height: 3.2rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      font-size: 1.2rem;
    }

    .metric-card[data-tone='emerald'] .metric-card__icon {
      background: rgba(217, 119, 6, 0.12);
      color: #9a670d;
    }

    .metric-card[data-tone='amber'] .metric-card__icon {
      background: rgba(245, 158, 11, 0.16);
      color: #b45309;
    }

    .metric-card[data-tone='sky'] .metric-card__icon {
      background: rgba(234, 179, 8, 0.14);
      color: #a16207;
    }

    .metric-card[data-tone='slate'] .metric-card__icon {
      background: rgba(120, 53, 15, 0.12);
      color: #7c2d12;
    }

    .metric-card span,
    .metric-card small {
      display: block;
      color: #8b6b2f;
    }

    .metric-card strong {
      display: block;
      margin: 0.25rem 0;
      color: #4a3210;
      font-size: 1.9rem;
      line-height: 1;
      font-family: 'Palatino Linotype', 'Book Antiqua', Georgia, serif;
    }

    .dashboard-columns {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr;
    }

    .card-surface {
      padding: 1.5rem;
      border-radius: 1.6rem;
      background: rgba(255, 251, 239, 0.96);
      border: 1px solid rgba(191, 140, 37, 0.18);
      box-shadow: 0 24px 45px rgba(101, 67, 33, 0.08);
    }

    .card-surface h3 {
      margin: 0 0 1rem;
      color: #4a3210;
      font-size: 1.05rem;
    }

    .quick-actions {
      display: grid;
      gap: 0.75rem;
    }

    .quick-actions__item {
      display: flex;
      gap: 0.9rem;
      align-items: flex-start;
      padding: 1rem;
      border-radius: 1rem;
      text-decoration: none;
      background: rgba(255, 250, 237, 0.95);
      border: 1px solid rgba(191, 140, 37, 0.16);
    }

    .quick-actions__item i {
      width: 2.35rem;
      height: 2.35rem;
      display: grid;
      place-items: center;
      border-radius: 0.9rem;
      background: rgba(245, 158, 11, 0.12);
      color: #9a670d;
    }

    .quick-actions__item strong {
      display: block;
      color: #4a3210;
    }

    .quick-actions__item small {
      margin: 0.2rem 0 0;
      color: #8b6b2f;
      line-height: 1.55;
    }

    @media (max-width: 1023px) {
      .dashboard-columns {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class DashboardPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usersApi = inject(UsersApiService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly roomsApi = inject(RoomsApiService);

  protected readonly loading = signal(true);
  protected readonly metrics = signal<DashboardMetricCard[]>([]);
  protected readonly quickActions = computed(() =>
    APP_NAV_ITEMS.filter(
      (item) => item.route !== '/dashboard' && this.authService.hasAnyRole(item.roles)
    ).slice(0, 6)
  );

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    const users$ = this.authService.hasRole('ADMIN')
      ? this.usersApi.getUsers().pipe(catchError(() => of([] as AppUser[])))
      : of([] as AppUser[]);

    const lowStockItems$ = this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'SERVICIO'])
      ? this.inventoryApi.getLowStockItems().pipe(catchError(() => of([] as SupplyItem[])))
      : of([] as SupplyItem[]);

    const alerts$ = this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA'])
      ? this.inventoryApi.getLowStockAlerts(true).pipe(catchError(() => of([] as LowStockAlert[])))
      : of([] as LowStockAlert[]);

    const rooms$ = this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'RECEPCION'])
      ? this.roomsApi.getRooms().pipe(catchError(() => of([] as Room[])))
      : of([] as Room[]);

    forkJoin({
      users: users$,
      lowStockItems: lowStockItems$,
      alerts: alerts$,
      rooms: rooms$
    })
      .pipe(take(1))
      .subscribe(({ users, lowStockItems, alerts, rooms }) => {
        const cards: DashboardMetricCard[] = [];

        if (this.authService.hasRole('ADMIN')) {
          cards.push({
            label: 'Usuarios registrados',
            value: String(users.length),
            helper: 'Accesos disponibles para la operación',
            icon: 'pi pi-users',
            tone: 'slate'
          });
        }

        if (this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'SERVICIO'])) {
          cards.push({
            label: 'Ítems con stock bajo',
            value: String(lowStockItems.length),
            helper: 'Productos que requieren atención',
            icon: 'pi pi-exclamation-circle',
            tone: 'amber'
          });
        }

        if (this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA'])) {
          cards.push({
            label: 'Alertas abiertas',
            value: String(alerts.length),
            helper: 'Seguimiento operativo del día',
            icon: 'pi pi-bell',
            tone: 'emerald'
          });
        }

        if (this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'RECEPCION'])) {
          cards.push({
            label: 'Habitaciones visibles',
            value: String(rooms.length),
            helper: 'Habitaciones activas en el hotel',
            icon: 'pi pi-building',
            tone: 'sky'
          });
        }

        this.metrics.set(cards);
        this.loading.set(false);
      });
  }
}
