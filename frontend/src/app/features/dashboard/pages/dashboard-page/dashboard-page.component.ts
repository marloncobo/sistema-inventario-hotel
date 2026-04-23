import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { catchError, forkJoin, of, take } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { RoomsApiService } from '@core/services/api/rooms-api.service';
import { UsersApiService } from '@core/services/api/users-api.service';
import { AuthService } from '@core/services/auth.service';
import type { AppUser } from '@models/app-user.model';
import type { InventoryMovement, LowStockAlert, SupplyItem } from '@models/inventory.model';
import type { Room, RoomSupplyAssignment } from '@models/room.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

type DashboardTone = 'gold' | 'amber' | 'emerald' | 'sky' | 'slate' | 'rose';

interface DashboardSnapshot {
  users: AppUser[];
  items: SupplyItem[];
  lowStockItems: SupplyItem[];
  alerts: LowStockAlert[];
  rooms: Room[];
  movements: InventoryMovement[];
  assignments: RoomSupplyAssignment[];
}

interface DashboardChip {
  label: string;
  value: string;
}

interface DashboardMetricCard {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone: DashboardTone;
}

interface DashboardFocusItem {
  label: string;
  detail: string;
  icon: string;
  tone: DashboardTone;
}

interface DashboardStatItem {
  label: string;
  value: string;
  helper: string;
  tone: DashboardTone;
}

interface DashboardDistributionItem {
  label: string;
  value: number;
  share: number;
  tone: DashboardTone;
}

interface DashboardWatchItem {
  title: string;
  meta: string;
  helper: string;
  tone: DashboardTone;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, PageHeaderComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css']
})
export class DashboardPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usersApi = inject(UsersApiService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly numberFormatter = new Intl.NumberFormat('es-CO');
  private readonly dayFormatter = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  private readonly shortDateFormatter = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short'
  });
  private readonly dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  });
  protected readonly activityWindowDays = 7;

  protected readonly loading = signal(true);
  protected readonly todayLabel = this.capitalize(this.dayFormatter.format(new Date()));
  protected readonly activityWindowLabel = `Ultimos ${this.activityWindowDays} dias`;
  protected readonly snapshot = signal<DashboardSnapshot>({
    users: [],
    items: [],
    lowStockItems: [],
    alerts: [],
    rooms: [],
    movements: [],
    assignments: []
  });

  protected readonly canViewUsers = computed(() => this.authService.hasRole('ADMIN'));
  protected readonly canViewInventory = computed(() =>
    this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'SERVICIO'])
  );
  protected readonly canViewAlerts = computed(() =>
    this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA'])
  );
  protected readonly canViewRooms = computed(() =>
    this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'RECEPCION'])
  );
  protected readonly canViewMovements = computed(() =>
    this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA'])
  );
  protected readonly canViewAssignments = computed(() =>
    this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'RECEPCION', 'SERVICIO'])
  );

  protected readonly activeUsersCount = computed(
    () => this.snapshot().users.filter((user) => user.active).length
  );
  protected readonly activeItemsCount = computed(
    () => this.snapshot().items.filter((item) => item.active).length
  );
  protected readonly inactiveItemsCount = computed(
    () => this.snapshot().items.filter((item) => !item.active).length
  );
  protected readonly activeRoomsCount = computed(
    () => this.snapshot().rooms.filter((room) => room.active).length
  );
  protected readonly inactiveRoomsCount = computed(
    () => this.snapshot().rooms.filter((room) => !room.active).length
  );
  protected readonly readyRoomsCount = computed(
    () =>
      this.snapshot().rooms.filter((room) => room.active && this.isAvailableStatus(room.status))
        .length
  );
  protected readonly committedRoomsCount = computed(() =>
    Math.max(this.activeRoomsCount() - this.readyRoomsCount(), 0)
  );
  protected readonly todayAssignmentsCount = computed(
    () => this.snapshot().assignments.filter((assignment) => this.isToday(assignment.createdAt)).length
  );
  protected readonly recentActivityCount = computed(
    () => this.snapshot().movements.length + this.snapshot().assignments.length
  );

  protected readonly heroTitle = computed(() => {
    const alerts = this.snapshot().alerts.length;
    const lowStock = this.snapshot().lowStockItems.length;
    const committedRooms = this.committedRoomsCount();
    const recentActivity = this.recentActivityCount();

    if (alerts > 0) {
      return 'Hay alertas abiertas que requieren seguimiento inmediato';
    }

    if (lowStock > 0 && committedRooms > 0) {
      return 'Inventario y habitaciones tienen frentes activos para revisar';
    }

    if (recentActivity > 0) {
      return 'La operacion tiene actividad reciente y control visible';
    }

    return 'Panel principal limpio con el estado operativo esencial';
  });

  protected readonly heroMessage = computed(() => {
    const fragments: string[] = [];
    const alerts = this.snapshot().alerts.length;
    const lowStock = this.snapshot().lowStockItems.length;
    const committedRooms = this.committedRoomsCount();
    const todayAssignments = this.todayAssignmentsCount();

    if (alerts > 0) {
      fragments.push(`${this.formatNumber(alerts)} alertas abiertas`);
    }

    if (lowStock > 0) {
      fragments.push(`${this.formatNumber(lowStock)} insumos bajo minimo`);
    }

    if (this.canViewRooms() && committedRooms > 0) {
      fragments.push(`${this.formatNumber(committedRooms)} habitaciones no disponibles`);
    }

    if (this.canViewAssignments() && todayAssignments > 0) {
      fragments.push(`${this.formatNumber(todayAssignments)} asignaciones registradas hoy`);
    }

    if (!fragments.length) {
      return 'La vista prioriza lo principal del backend y deja por fuera los accesos que ya viven en el sidebar.';
    }

    return `El foco de este momento esta en ${this.joinWithAnd(fragments)}.`;
  });

  protected readonly overviewChips = computed<DashboardChip[]>(() => {
    const chips: DashboardChip[] = [];

    if (this.canViewInventory()) {
      chips.push({
        label: 'Insumos activos',
        value: this.formatNumber(this.activeItemsCount())
      });
    }

    if (this.canViewRooms()) {
      chips.push({
        label: 'Habitaciones activas',
        value: this.formatNumber(this.activeRoomsCount())
      });
    }

    if (this.canViewUsers()) {
      chips.push({
        label: 'Usuarios activos',
        value: this.formatNumber(this.activeUsersCount())
      });
    }

    if (this.canViewAssignments() || this.canViewMovements()) {
      chips.push({
        label: this.activityWindowLabel,
        value: this.formatNumber(this.recentActivityCount())
      });
    }

    return chips;
  });

  protected readonly metrics = computed<DashboardMetricCard[]>(() => {
    const cards: DashboardMetricCard[] = [];

    if (this.canViewUsers()) {
      cards.push({
        label: 'Usuarios activos',
        value: this.formatNumber(this.activeUsersCount()),
        helper: 'Perfiles habilitados para operar hoy',
        icon: 'pi pi-users',
        tone: 'slate'
      });
    }

    if (this.canViewInventory()) {
      cards.push({
        label: 'Insumos visibles',
        value: this.formatNumber(this.activeItemsCount()),
        helper: 'Base activa del inventario cargado',
        icon: 'pi pi-box',
        tone: 'gold'
      });
    }

    if (this.canViewAlerts()) {
      cards.push({
        label: 'Alertas abiertas',
        value: this.formatNumber(this.snapshot().alerts.length),
        helper: 'Seguimiento actual del stock bajo',
        icon: 'pi pi-bell',
        tone: this.snapshot().alerts.length > 0 ? 'rose' : 'emerald'
      });
    } else if (this.canViewInventory()) {
      cards.push({
        label: 'Stock bajo',
        value: this.formatNumber(this.snapshot().lowStockItems.length),
        helper: 'Insumos por debajo del minimo visible',
        icon: 'pi pi-exclamation-triangle',
        tone: this.snapshot().lowStockItems.length > 0 ? 'amber' : 'emerald'
      });
    }

    if (this.canViewRooms()) {
      cards.push({
        label: 'Habitaciones listas',
        value: this.formatNumber(this.readyRoomsCount()),
        helper: `${this.formatNumber(this.committedRoomsCount())} en uso o atencion`,
        icon: 'pi pi-home',
        tone: this.committedRoomsCount() > 0 ? 'amber' : 'emerald'
      });
    }

    if (this.canViewAssignments() || this.canViewMovements()) {
      cards.push({
        label: 'Actividad reciente',
        value: this.formatNumber(this.recentActivityCount()),
        helper: `Movimientos y asignaciones de los ${this.activityWindowDays} dias cargados`,
        icon: 'pi pi-clock',
        tone: 'sky'
      });
    }

    return cards;
  });

  protected readonly focusItems = computed<DashboardFocusItem[]>(() => {
    const items: DashboardFocusItem[] = [];
    const alerts = this.snapshot().alerts.length;
    const lowStock = this.snapshot().lowStockItems.length;
    const committedRooms = this.committedRoomsCount();
    const todayAssignments = this.todayAssignmentsCount();

    if (this.canViewAlerts()) {
      items.push(
        alerts > 0
          ? {
              label: 'Alertas abiertas',
              detail: `${this.formatNumber(alerts)} pendientes de seguimiento operativo`,
              icon: 'pi pi-bell',
              tone: 'rose'
            }
          : {
              label: 'Alertas controladas',
              detail: 'No hay alertas abiertas en la vista actual',
              icon: 'pi pi-check-circle',
              tone: 'emerald'
            }
      );
    }

    if (this.canViewInventory()) {
      items.push(
        lowStock > 0
          ? {
              label: 'Stock bajo',
              detail: `${this.formatNumber(lowStock)} insumos siguen por debajo del minimo`,
              icon: 'pi pi-exclamation-triangle',
              tone: 'amber'
            }
          : {
              label: 'Cobertura estable',
              detail: 'No se detectan insumos bajo minimo en lo visible',
              icon: 'pi pi-shield',
              tone: 'emerald'
            }
      );
    }

    if (this.canViewRooms()) {
      items.push(
        committedRooms > 0
          ? {
              label: 'Habitaciones comprometidas',
              detail: `${this.formatNumber(committedRooms)} no estan disponibles de inmediato`,
              icon: 'pi pi-building',
              tone: 'gold'
            }
          : {
              label: 'Habitaciones disponibles',
              detail: 'Las visibles estan listas o sin presion operativa',
              icon: 'pi pi-home',
              tone: 'emerald'
            }
      );
    }

    if (this.canViewAssignments()) {
      items.push(
        todayAssignments > 0
          ? {
              label: 'Asignaciones del dia',
              detail: `${this.formatNumber(todayAssignments)} entregas registradas en la fecha actual`,
              icon: 'pi pi-send',
              tone: 'sky'
            }
          : {
              label: 'Sin asignaciones hoy',
              detail: 'No hay nuevas entregas en la fecha actual',
              icon: 'pi pi-calendar',
              tone: 'slate'
            }
      );
    }

    if (this.canViewUsers()) {
      items.push({
        label: 'Equipo habilitado',
        detail: `${this.formatNumber(this.activeUsersCount())} usuarios activos en el sistema`,
        icon: 'pi pi-users',
        tone: 'slate'
      });
    }

    return items.slice(0, 4);
  });

  protected readonly inventoryStats = computed<DashboardStatItem[]>(() => {
    if (!this.canViewInventory()) {
      return [];
    }

    const activeItems = this.activeItemsCount();
    const lowStock = this.snapshot().lowStockItems.length;
    const stableItems = Math.max(activeItems - lowStock, 0);
    const coverage = activeItems > 0 ? Math.round((stableItems / activeItems) * 100) : 0;

    return [
      {
        label: 'Items activos',
        value: this.formatNumber(activeItems),
        helper: 'Referencias visibles y habilitadas',
        tone: 'gold'
      },
      {
        label: 'Stock bajo',
        value: this.formatNumber(lowStock),
        helper: lowStock > 0 ? 'Requieren reposicion o revision' : 'Sin presion inmediata',
        tone: lowStock > 0 ? 'amber' : 'emerald'
      },
      {
        label: 'Cobertura',
        value: `${coverage}%`,
        helper: `${this.formatNumber(stableItems)} items por encima del minimo`,
        tone: 'emerald'
      },
      {
        label: 'Inactivos',
        value: this.formatNumber(this.inactiveItemsCount()),
        helper: 'Referencias fuera de uso operativo',
        tone: 'slate'
      }
    ];
  });

  protected readonly inventoryCoverageBadge = computed(() => {
    const activeItems = this.activeItemsCount();
    const lowStock = this.snapshot().lowStockItems.length;

    if (!activeItems) {
      return 'Sin inventario cargado';
    }

    return `${Math.max(Math.round(((activeItems - lowStock) / activeItems) * 100), 0)}% estable`;
  });

  protected readonly roomStats = computed<DashboardStatItem[]>(() => {
    if (!this.canViewRooms()) {
      return [];
    }

    return [
      {
        label: 'Habitaciones activas',
        value: this.formatNumber(this.activeRoomsCount()),
        helper: 'Unidades visibles en el backend',
        tone: 'gold'
      },
      {
        label: 'Disponibles',
        value: this.formatNumber(this.readyRoomsCount()),
        helper: 'Listas para operacion inmediata',
        tone: 'emerald'
      },
      {
        label: 'Comprometidas',
        value: this.formatNumber(this.committedRoomsCount()),
        helper: 'En uso o en atencion',
        tone: this.committedRoomsCount() > 0 ? 'amber' : 'emerald'
      },
      {
        label: 'Inactivas',
        value: this.formatNumber(this.inactiveRoomsCount()),
        helper: 'Fuera de visibilidad operativa',
        tone: 'slate'
      }
    ];
  });

  protected readonly roomAvailabilityBadge = computed(() => {
    const activeRooms = this.activeRoomsCount();

    if (!activeRooms) {
      return 'Sin habitaciones activas';
    }

    return `${Math.round((this.readyRoomsCount() / activeRooms) * 100)}% disponibles`;
  });

  protected readonly roomStatusBreakdown = computed<DashboardDistributionItem[]>(() => {
    if (!this.canViewRooms()) {
      return [];
    }

    const activeRooms = this.snapshot().rooms.filter((room) => room.active);
    const total = activeRooms.length;

    if (!total) {
      return [];
    }

    const counts = new Map<string, number>();

    for (const room of activeRooms) {
      const label = this.formatLabel(room.status);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([label, value]) => ({
        label,
        value,
        share: Math.round((value / total) * 100),
        tone: this.toneForRoomStatus(label)
      }))
      .sort((left, right) => right.value - left.value);
  });

  protected readonly watchlistItems = computed<DashboardWatchItem[]>(() => {
    if (!this.canViewInventory()) {
      return [];
    }

    if (this.canViewAlerts() && this.snapshot().alerts.length) {
      return this.snapshot()
        .alerts
        .slice()
        .sort((left, right) => {
          if (left.currentStock === right.currentStock) {
            return this.toTimestamp(right.createdAt) - this.toTimestamp(left.createdAt);
          }

          return left.currentStock - right.currentStock;
        })
        .slice(0, 4)
        .map((alert) => ({
          title: alert.itemName,
          meta: `Stock ${this.formatNumber(alert.currentStock)} / minimo ${this.formatNumber(alert.minStock)}`,
          helper: `Abierta ${this.formatShortDate(alert.createdAt)}`,
          tone: alert.currentStock === 0 ? 'rose' : 'amber'
        }));
    }

    return this.snapshot()
      .lowStockItems
      .slice()
      .sort((left, right) => left.stock - right.stock)
      .slice(0, 4)
      .map((item) => ({
        title: item.name,
        meta: `Stock ${this.formatNumber(item.stock)} / minimo ${this.formatNumber(item.minStock)}`,
        helper: item.providerName || item.category || 'Pendiente de reposicion',
        tone: item.stock === 0 ? 'rose' : 'amber'
      }));
  });

  protected readonly recentMovements = computed(() =>
    this.snapshot()
      .movements
      .slice()
      .sort((left, right) => this.toTimestamp(right.createdAt) - this.toTimestamp(left.createdAt))
      .slice(0, 5)
  );

  protected readonly recentAssignments = computed(() =>
    this.snapshot()
      .assignments
      .slice()
      .sort((left, right) => this.toTimestamp(right.createdAt) - this.toTimestamp(left.createdAt))
      .slice(0, 5)
  );

  ngOnInit(): void {
    this.loadDashboard();
  }

  protected formatLabel(value: string | null | undefined): string {
    if (!value) {
      return 'Sin dato';
    }

    return value
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  protected formatDateTime(value: string): string {
    return this.dateTimeFormatter.format(new Date(value));
  }

  protected formatMovementContext(movement: InventoryMovement): string {
    const fragments = [this.formatLabel(movement.movementType)];

    if (movement.roomNumber) {
      fragments.push(`Hab. ${movement.roomNumber}`);
    } else if (movement.areaName) {
      fragments.push(movement.areaName);
    } else if (movement.providerName) {
      fragments.push(movement.providerName);
    } else if (movement.origin) {
      fragments.push(this.formatLabel(movement.origin));
    }

    fragments.push(`Stock final ${this.formatNumber(movement.stockAfter)}`);

    return fragments.join(' · ');
  }

  protected formatAssignmentContext(assignment: RoomSupplyAssignment): string {
    const fragments = [`Hab. ${assignment.roomNumber}`, this.formatLabel(assignment.assignmentType)];

    if (assignment.guestName) {
      fragments.push(assignment.guestName);
    }

    fragments.push(`Entrega: ${assignment.deliveredBy}`);

    return fragments.join(' · ');
  }

  private loadDashboard(): void {
    this.loading.set(true);

    const activityStartDate = this.getActivityStartDate();
    const users$ = this.canViewUsers()
      ? this.usersApi.getUsers().pipe(catchError(() => of([] as AppUser[])))
      : of([] as AppUser[]);
    const items$ = this.canViewInventory()
      ? this.inventoryApi.getItems().pipe(catchError(() => of([] as SupplyItem[])))
      : of([] as SupplyItem[]);
    const lowStockItems$ = this.canViewInventory()
      ? this.inventoryApi.getLowStockItems().pipe(catchError(() => of([] as SupplyItem[])))
      : of([] as SupplyItem[]);
    const alerts$ = this.canViewAlerts()
      ? this.inventoryApi.getLowStockAlerts(true).pipe(catchError(() => of([] as LowStockAlert[])))
      : of([] as LowStockAlert[]);
    const rooms$ = this.canViewRooms()
      ? this.roomsApi.getRooms().pipe(catchError(() => of([] as Room[])))
      : of([] as Room[]);
    const movements$ = this.canViewMovements()
      ? this.inventoryApi
          .getMovements({ startDate: activityStartDate })
          .pipe(catchError(() => of([] as InventoryMovement[])))
      : of([] as InventoryMovement[]);
    const assignments$ = this.canViewAssignments()
      ? this.roomsApi
          .getAllAssignments({ startDate: activityStartDate })
          .pipe(catchError(() => of([] as RoomSupplyAssignment[])))
      : of([] as RoomSupplyAssignment[]);

    forkJoin({
      users: users$,
      items: items$,
      lowStockItems: lowStockItems$,
      alerts: alerts$,
      rooms: rooms$,
      movements: movements$,
      assignments: assignments$
    })
      .pipe(take(1))
      .subscribe((snapshot) => {
        this.snapshot.set(snapshot);
        this.loading.set(false);
      });
  }

  private isAvailableStatus(status: string | null | undefined): boolean {
    const normalized = this.normalizeValue(status);
    return normalized.includes('disponible') || normalized.includes('libre');
  }

  private toneForRoomStatus(status: string): DashboardTone {
    const normalized = this.normalizeValue(status);

    if (normalized.includes('disponible') || normalized.includes('libre')) {
      return 'emerald';
    }

    if (normalized.includes('ocup')) {
      return 'gold';
    }

    if (
      normalized.includes('limpieza') ||
      normalized.includes('aseo') ||
      normalized.includes('prepar')
    ) {
      return 'sky';
    }

    if (
      normalized.includes('mantenimiento') ||
      normalized.includes('bloque') ||
      normalized.includes('fuera')
    ) {
      return 'rose';
    }

    return 'slate';
  }

  private normalizeValue(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .trim();
  }

  private formatShortDate(value: string): string {
    return this.shortDateFormatter.format(new Date(value));
  }

  private formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  private toTimestamp(value: string): number {
    return new Date(value).getTime();
  }

  private isToday(value: string): boolean {
    return this.toDateKey(new Date(value)) === this.toDateKey(new Date());
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getActivityStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - (this.activityWindowDays - 1));
    return this.toDateKey(date);
  }

  private joinWithAnd(items: string[]): string {
    if (items.length <= 1) {
      return items[0] ?? '';
    }

    return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
