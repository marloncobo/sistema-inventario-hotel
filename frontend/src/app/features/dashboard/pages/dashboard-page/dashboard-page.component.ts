import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { APP_NAV_CATEGORIES, APP_NAV_ITEMS } from '@core/constants/navigation';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { RoomsApiService } from '@core/services/api/rooms-api.service';
import { UsersApiService } from '@core/services/api/users-api.service';
import { AuthService } from '@core/services/auth.service';
import type { AppUser } from '@models/app-user.model';
import type { LowStockAlert, SupplyItem } from '@models/inventory.model';
import type { NavigationItem } from '@models/navigation.model';
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

interface DashboardSnapshot {
  users: number;
  lowStockItems: number;
  alerts: number;
  rooms: number;
}

interface DashboardAccessSection {
  id: string;
  label: string;
  eyebrow: string;
  description: string;
  icon: string;
  items: NavigationItem[];
}

interface DashboardPriorityItem {
  label: string;
  detail: string;
  icon: string;
  tone: 'success' | 'warn' | 'danger' | 'info';
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
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css']
})
export class DashboardPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usersApi = inject(UsersApiService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly roomsApi = inject(RoomsApiService);

  protected readonly loading = signal(true);
  protected readonly snapshot = signal<DashboardSnapshot>({
    users: 0,
    lowStockItems: 0,
    alerts: 0,
    rooms: 0
  });

  protected readonly metrics = computed<DashboardMetricCard[]>(() => {
    const snapshot = this.snapshot();
    const cards: DashboardMetricCard[] = [];

    if (this.authService.hasRole('ADMIN')) {
      cards.push({
        label: 'Usuarios registrados',
        value: String(snapshot.users),
        helper: 'Accesos disponibles para la operacion',
        icon: 'pi pi-users',
        tone: 'slate'
      });
    }

    if (this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'SERVICIO'])) {
      cards.push({
        label: 'Items con stock bajo',
        value: String(snapshot.lowStockItems),
        helper: 'Productos que requieren atencion',
        icon: 'pi pi-exclamation-circle',
        tone: 'amber'
      });
    }

    if (this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA'])) {
      cards.push({
        label: 'Alertas abiertas',
        value: String(snapshot.alerts),
        helper: 'Seguimiento operativo del dia',
        icon: 'pi pi-bell',
        tone: 'emerald'
      });
    }

    if (this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'RECEPCION'])) {
      cards.push({
        label: 'Habitaciones visibles',
        value: String(snapshot.rooms),
        helper: 'Unidades visibles en la operacion',
        icon: 'pi pi-building',
        tone: 'sky'
      });
    }

    return cards;
  });

  protected readonly accessSections = computed<DashboardAccessSection[]>(() => {
    const sections: DashboardAccessSection[] = [];

    for (const category of APP_NAV_CATEGORIES) {
      const items = category.groups
        .flatMap((group) => group.items)
        .filter(
          (item) => item.route !== '/dashboard' && this.authService.hasAnyRole(item.roles)
        );

      if (!items.length) {
        continue;
      }

      sections.push({
        id: category.id,
        label: category.label,
        eyebrow: category.eyebrow,
        description: category.description,
        icon: category.icon,
        items
      });
    }

    return sections;
  });

  protected readonly quickActions = computed(() =>
    APP_NAV_ITEMS.filter(
      (item) => item.route !== '/dashboard' && this.authService.hasAnyRole(item.roles)
    ).slice(0, 6)
  );

  protected readonly primaryAction = computed(() => this.quickActions()[0] ?? null);

  protected readonly moduleCount = computed(
    () =>
      APP_NAV_ITEMS.filter(
        (item) => item.route !== '/dashboard' && this.authService.hasAnyRole(item.roles)
      ).length
  );

  protected readonly heroTitle = computed(() => {
    const snapshot = this.snapshot();

    if (snapshot.alerts > 0) {
      return 'Operacion con frentes que requieren seguimiento';
    }

    if (snapshot.lowStockItems > 0) {
      return 'Operacion estable con inventario en observacion';
    }

    if (snapshot.rooms > 0 || snapshot.users > 0) {
      return 'Panel listo para coordinar la jornada';
    }

    return 'Panorama inicial listo para operar';
  });

  protected readonly heroMessage = computed(() => {
    const snapshot = this.snapshot();

    if (snapshot.alerts > 0) {
      return 'Conviene revisar alertas e inventario antes de avanzar con nuevas solicitudes.';
    }

    if (snapshot.lowStockItems > 0) {
      return 'No hay alertas abiertas, pero si productos que merecen reposicion o control.';
    }

    return 'La vista resume modulos habilitados, metricas visibles y accesos para la operacion del hotel.';
  });

  protected readonly priorityItems = computed<DashboardPriorityItem[]>(() => {
    const snapshot = this.snapshot();
    const items: DashboardPriorityItem[] = [];

    if (snapshot.alerts > 0) {
      items.push({
        label: `${snapshot.alerts} alertas pendientes`,
        detail: 'Valida reposicion, incidencias y seguimiento del turno.',
        icon: 'pi pi-bell',
        tone: 'danger'
      });
    }

    if (snapshot.lowStockItems > 0) {
      items.push({
        label: `${snapshot.lowStockItems} insumos en minimo`,
        detail: 'Revisa inventario y plan de reabastecimiento.',
        icon: 'pi pi-exclamation-triangle',
        tone: 'warn'
      });
    }

    if (snapshot.rooms > 0) {
      items.push({
        label: `${snapshot.rooms} habitaciones visibles`,
        detail: 'Confirma estados antes de registrar nuevas asignaciones.',
        icon: 'pi pi-home',
        tone: 'info'
      });
    }

    if (this.authService.hasRole('ADMIN')) {
      items.push({
        label: `${snapshot.users} usuarios registrados`,
        detail: 'Manten controlados los perfiles y accesos activos.',
        icon: 'pi pi-users',
        tone: 'success'
      });
    }

    if (!items.length) {
      items.push({
        label: 'Sin pendientes criticos',
        detail: 'La vista no reporta frentes operativos para este perfil.',
        icon: 'pi pi-check-circle',
        tone: 'success'
      });
    }

    return items.slice(0, 4);
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);

    const users$ = this.authService.hasRole('ADMIN')
      ? this.usersApi.getUsers().pipe(catchError(() => of([] as AppUser[])))
      : of([] as AppUser[]);

    const lowStockItems$ = this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'SERVICIO'])
      ? this.inventoryApi.getLowStockItems().pipe(catchError(() => of([] as SupplyItem[])))
      : of([] as SupplyItem[]);

    const alerts$ = this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA'])
      ? this.inventoryApi
          .getLowStockAlerts(true)
          .pipe(catchError(() => of([] as LowStockAlert[])))
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
        this.snapshot.set({
          users: users.length,
          lowStockItems: lowStockItems.length,
          alerts: alerts.length,
          rooms: rooms.length
        });
        this.loading.set(false);
      });
  }
}
