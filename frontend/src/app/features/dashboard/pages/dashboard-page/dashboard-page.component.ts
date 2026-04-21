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
        eyebrow="Resumen ejecutivo"
        title="Dashboard"
        subtitle="Primer panel operativo del frontend Angular, conectado al gateway real y adaptado al rol autenticado."
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
          <p>Cargando datos permitidos para el rol actual...</p>
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

          <article class="card-surface">
            <h3>Notas de integración</h3>
            <div class="notes-list">
              @for (note of operationalNotes(); track note) {
                <article>
                  <i class="pi pi-info-circle"></i>
                  <p>{{ note }}</p>
                </article>
              }
            </div>
          </article>
        </section>

        @if (roomStatusSummary().length) {
          <article class="card-surface">
            <h3>Estado operativo de habitaciones</h3>
            <div class="status-summary">
              @for (status of roomStatusSummary(); track status.label) {
                <div class="status-pill">
                  <strong>{{ status.count }}</strong>
                  <span>{{ status.label }}</span>
                </div>
              }
            </div>
          </article>
        }

        @if (!metrics().length) {
          <app-empty-state
            icon="pi pi-chart-bar"
            title="Sin métricas para mostrar"
            message="El rol autenticado no tiene endpoints de resumen disponibles en esta fase. El shell y la seguridad sí quedaron operativos."
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
      color: #475569;
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
      background: white;
      border: 1px solid rgba(148, 163, 184, 0.18);
      box-shadow: 0 24px 45px rgba(15, 23, 42, 0.06);
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
      background: rgba(34, 197, 94, 0.12);
      color: #15803d;
    }

    .metric-card[data-tone='amber'] .metric-card__icon {
      background: rgba(245, 158, 11, 0.14);
      color: #b45309;
    }

    .metric-card[data-tone='sky'] .metric-card__icon {
      background: rgba(14, 165, 233, 0.14);
      color: #0369a1;
    }

    .metric-card[data-tone='slate'] .metric-card__icon {
      background: rgba(100, 116, 139, 0.12);
      color: #334155;
    }

    .metric-card span,
    .metric-card small {
      display: block;
      color: #64748b;
    }

    .metric-card strong {
      display: block;
      margin: 0.25rem 0;
      color: #0f172a;
      font-size: 1.9rem;
      line-height: 1;
    }

    .dashboard-columns {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1.2fr 1fr;
    }

    .card-surface {
      padding: 1.5rem;
      border-radius: 1.6rem;
      background: white;
      border: 1px solid rgba(148, 163, 184, 0.18);
      box-shadow: 0 24px 45px rgba(15, 23, 42, 0.06);
    }

    .card-surface h3 {
      margin: 0 0 1rem;
      color: #0f172a;
      font-size: 1.05rem;
    }

    .quick-actions,
    .notes-list {
      display: grid;
      gap: 0.75rem;
    }

    .quick-actions__item,
    .notes-list article {
      display: flex;
      gap: 0.9rem;
      align-items: flex-start;
      padding: 1rem;
      border-radius: 1rem;
      text-decoration: none;
      background: rgba(248, 250, 252, 0.95);
      border: 1px solid rgba(148, 163, 184, 0.16);
    }

    .quick-actions__item i,
    .notes-list i {
      width: 2.35rem;
      height: 2.35rem;
      display: grid;
      place-items: center;
      border-radius: 0.9rem;
      background: rgba(14, 165, 233, 0.1);
      color: #0369a1;
    }

    .quick-actions__item strong {
      display: block;
      color: #0f172a;
    }

    .quick-actions__item small,
    .notes-list p {
      margin: 0.2rem 0 0;
      color: #64748b;
      line-height: 1.55;
    }

    .status-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .status-pill {
      display: inline-grid;
      gap: 0.25rem;
      min-width: 8rem;
      padding: 0.9rem 1rem;
      border-radius: 1rem;
      background: rgba(240, 249, 255, 0.95);
      border: 1px solid rgba(125, 211, 252, 0.24);
    }

    .status-pill strong {
      color: #0f172a;
      font-size: 1.15rem;
    }

    .status-pill span {
      color: #0f766e;
      font-size: 0.86rem;
      font-weight: 600;
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
  protected readonly roomStatusSummary = signal<Array<{ label: string; count: number }>>([]);

  protected readonly quickActions = computed(() =>
    APP_NAV_ITEMS.filter(
      (item) =>
        item.route !== '/dashboard' && this.authService.hasAnyRole(item.roles)
    ).slice(0, 6)
  );

  protected readonly operationalNotes = computed(() => {
    const notes = [
      'El frontend consume solo el API Gateway y envía el JWT exactamente como `Authorization: Bearer <token>`.'
    ];

    if (this.authService.hasRole('SERVICIO')) {
      notes.push(
        'El backend permite asignar insumos a SERVICIO, pero no expone un flujo completo para resolver `roomId` por número sin apoyo adicional de UI.'
      );
    }

    if (this.authService.hasRole('RECEPCION')) {
      notes.push(
        'RECEPCION puede consultar reportes de habitaciones, pero la exportación de esos reportes sigue restringida a ADMIN.'
      );
    }

    if (this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA'])) {
      notes.push(
        'Las alertas y movimientos de inventario se mantendrán en el frontend usando filtros del backend, sin cambiar contratos.'
      );
    }

    return notes;
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    const users$ = this.authService.hasRole('ADMIN')
      ? this.usersApi.getUsers().pipe(catchError(() => of([] as AppUser[])))
      : of([] as AppUser[]);

    const lowStockItems$ = this.authService.hasAnyRole([
      'ADMIN',
      'ALMACENISTA',
      'SERVICIO'
    ])
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
            helper: 'Usuarios administrados por el gateway',
            icon: 'pi pi-users',
            tone: 'slate'
          });
        }

        if (this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'SERVICIO'])) {
          cards.push({
            label: 'Ítems con stock bajo',
            value: String(lowStockItems.length),
            helper: 'Resultado de /items/low-stock',
            icon: 'pi pi-exclamation-circle',
            tone: 'amber'
          });
        }

        if (this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA'])) {
          cards.push({
            label: 'Alertas abiertas',
            value: String(alerts.length),
            helper: 'Seguimiento operativo de bajo inventario',
            icon: 'pi pi-bell',
            tone: 'emerald'
          });
        }

        if (this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'RECEPCION'])) {
          cards.push({
            label: 'Habitaciones visibles',
            value: String(rooms.length),
            helper: 'Consulta actual desde rooms-service',
            icon: 'pi pi-building',
            tone: 'sky'
          });
        }

        this.metrics.set(cards);
        this.roomStatusSummary.set(this.summarizeRooms(rooms));
        this.loading.set(false);
      });
  }

  private summarizeRooms(rooms: Room[]): Array<{ label: string; count: number }> {
    const summary = rooms.reduce<Record<string, number>>((acc, room) => {
      acc[room.status] = (acc[room.status] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(summary).map(([label, count]) => ({ label, count }));
  }
}
