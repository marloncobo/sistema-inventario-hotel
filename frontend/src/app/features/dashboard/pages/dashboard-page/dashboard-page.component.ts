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

type DashboardTone = 'emerald' | 'gold' | 'amber' | 'rose' | 'slate';
type DashboardArt = 'box' | 'bed' | 'bell' | 'chart' | 'shield' | 'door' | 'clipboard' | 'package';

interface DashboardSnapshot {
  users: AppUser[];
  items: SupplyItem[];
  lowStockItems: SupplyItem[];
  alerts: LowStockAlert[];
  rooms: Room[];
  movements: InventoryMovement[];
  assignments: RoomSupplyAssignment[];
}

interface DashboardKpiCard {
  label: string;
  value: string;
  helper: string;
  tone: DashboardTone;
  art: DashboardArt;
}

interface DashboardBreakdownItem {
  label: string;
  value: number;
  share: number;
  helper: string;
  tone: DashboardTone;
}

interface DashboardInsight {
  title: string;
  text: string;
  tone: DashboardTone;
  art: DashboardArt;
}

interface DashboardActivityItem {
  id: number;
  title: string;
  detail: string;
  badge: string;
  stamp: string;
}

interface DashboardStatusBanner {
  title: string;
  text: string;
  tone: DashboardTone;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css']
})
export class DashboardPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usersApi = inject(UsersApiService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly numberFormatter = new Intl.NumberFormat('es-CO');
  private readonly headerDateFormatter = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  private readonly dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  });
  protected readonly activityWindowDays = 7;

  protected readonly loading = signal(true);
  protected readonly todayLabel = this.capitalize(this.headerDateFormatter.format(new Date()));
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

  protected readonly visibleItemsCount = computed(() => this.snapshot().items.length);
  protected readonly activeItemsCount = computed(
    () => this.snapshot().items.filter((item) => item.active).length
  );
  protected readonly inactiveItemsCount = computed(
    () => this.snapshot().items.filter((item) => !item.active).length
  );
  protected readonly lowStockCount = computed(() => this.snapshot().lowStockItems.length);
  protected readonly openAlertsCount = computed(() => this.snapshot().alerts.length);
  protected readonly stableItemsCount = computed(() =>
    Math.max(this.activeItemsCount() - this.lowStockCount(), 0)
  );
  protected readonly inventoryCoveragePercentage = computed(() => {
    const activeItems = this.activeItemsCount();

    if (!activeItems) {
      return 0;
    }

    return Math.max(Math.round((this.stableItemsCount() / activeItems) * 100), 0);
  });

  protected readonly visibleRoomsCount = computed(() => this.snapshot().rooms.length);
  protected readonly activeRoomsCount = computed(
    () => this.snapshot().rooms.filter((room) => room.active).length
  );
  protected readonly inactiveRoomsCount = computed(
    () => this.snapshot().rooms.filter((room) => !room.active).length
  );
  protected readonly availableRoomsCount = computed(
    () =>
      this.snapshot().rooms.filter((room) => room.active && this.isAvailableStatus(room.status))
        .length
  );
  protected readonly committedRoomsCount = computed(() =>
    Math.max(this.activeRoomsCount() - this.availableRoomsCount(), 0)
  );
  protected readonly roomAvailabilityPercentage = computed(() => {
    const activeRooms = this.activeRoomsCount();

    if (!activeRooms) {
      return 0;
    }

    return Math.round((this.availableRoomsCount() / activeRooms) * 100);
  });

  protected readonly activeUsersCount = computed(
    () => this.snapshot().users.filter((user) => user.active).length
  );
  protected readonly todayAssignmentsCount = computed(
    () => this.snapshot().assignments.filter((assignment) => this.isToday(assignment.createdAt)).length
  );
  protected readonly recentActivityCount = computed(
    () => this.snapshot().movements.length + this.snapshot().assignments.length
  );

  protected readonly displayName = computed(() =>
    this.formatDisplayName(this.authService.username() || 'admin')
  );

  protected readonly headerSummary = computed(() => {
    const coverage = this.inventoryCoveragePercentage();
    const availableRooms = this.availableRoomsCount();
    const alerts = this.openAlertsCount();
    const lowStock = this.lowStockCount();
    const recentActivity = this.recentActivityCount();

    if (this.canViewInventory() && this.canViewRooms()) {
      if (alerts > 0) {
        return `${this.formatNumber(alerts)} alertas abiertas, ${coverage}% de cobertura visible y ${this.formatNumber(availableRooms)} habitaciones disponibles para operar.`;
      }

      if (lowStock > 0) {
        return `${this.formatNumber(availableRooms)} habitaciones siguen disponibles y el inventario mantiene ${coverage}% de cobertura, con ${this.formatNumber(lowStock)} insumos en seguimiento.`;
      }

      return `${this.formatNumber(availableRooms)} habitaciones listas, cobertura de inventario en ${coverage}% y ${this.formatNumber(recentActivity)} eventos recientes en la ultima semana.`;
    }

    if (this.canViewInventory()) {
      if (lowStock > 0) {
        return `La cobertura visible esta en ${coverage}% y hay ${this.formatNumber(lowStock)} insumos bajo minimo para revisar.`;
      }

      return `La salud del inventario se mantiene estable con ${coverage}% de cobertura sobre ${this.formatNumber(this.activeItemsCount())} insumos activos.`;
    }

    if (this.canViewRooms()) {
      return `${this.formatNumber(availableRooms)} habitaciones disponibles y ${this.formatNumber(this.committedRoomsCount())} comprometidas en la vista actual.`;
    }

    if (this.canViewAssignments()) {
      return `${this.formatNumber(this.todayAssignmentsCount())} asignaciones registradas hoy y ${this.formatNumber(recentActivity)} eventos recientes en los ultimos ${this.activityWindowDays} dias.`;
    }

    return 'Consulta el estado esencial del sistema sin repetir los modulos del menu lateral.';
  });

  protected readonly statusChipLabel = computed(() => {
    const tone = this.statusBanner().tone;

    if (tone === 'rose') {
      return 'Requiere seguimiento';
    }

    if (tone === 'gold' || tone === 'amber') {
      return 'Bajo control';
    }

    return 'Operacion estable';
  });

  protected readonly inventoryHealthTone = computed<DashboardTone>(() => {
    const coverage = this.inventoryCoveragePercentage();

    if (!this.activeItemsCount()) {
      return 'slate';
    }

    if (this.openAlertsCount() > 0 || coverage < 80) {
      return 'rose';
    }

    if (this.lowStockCount() > 0 || coverage < 95) {
      return 'amber';
    }

    return 'emerald';
  });

  protected readonly inventoryCoverageHelper = computed(() => {
    if (!this.canViewInventory()) {
      return '';
    }

    if (!this.activeItemsCount()) {
      return 'Sin insumos activos visibles';
    }

    if (this.lowStockCount() > 0) {
      return `${this.formatNumber(this.stableItemsCount())} de ${this.formatNumber(this.activeItemsCount())} insumos activos sobre minimo`;
    }

    return `${this.formatNumber(this.activeItemsCount())} insumos activos con cobertura estable`;
  });

  protected readonly kpiCards = computed<DashboardKpiCard[]>(() => {
    const cards: DashboardKpiCard[] = [];

    if (this.canViewInventory()) {
      cards.push({
        label: 'Cobertura de inventario',
        value: `${this.inventoryCoveragePercentage()}%`,
        helper: this.inventoryCoverageHelper(),
        tone: this.inventoryHealthTone(),
        art: 'box'
      });
    }

    if (this.canViewRooms()) {
      cards.push({
        label: 'Habitaciones disponibles',
        value: this.formatNumber(this.availableRoomsCount()),
        helper: this.activeRoomsCount()
          ? `${this.roomAvailabilityPercentage()}% de las activas listas para operar`
          : 'Sin habitaciones activas visibles',
        tone: this.availableRoomsCount() > 0 ? 'emerald' : 'slate',
        art: 'bed'
      });
    }

    if (this.canViewAlerts()) {
      cards.push({
        label: 'Alertas abiertas',
        value: this.formatNumber(this.openAlertsCount()),
        helper:
          this.openAlertsCount() > 0
            ? 'Hay seguimiento pendiente de inventario'
            : 'No hay alertas activas en este momento',
        tone: this.openAlertsCount() > 0 ? 'rose' : 'emerald',
        art: 'bell'
      });
    } else if (this.canViewInventory()) {
      cards.push({
        label: 'Stock bajo',
        value: this.formatNumber(this.lowStockCount()),
        helper:
          this.lowStockCount() > 0
            ? 'Insumos por debajo del minimo visible'
            : 'No hay quiebres visibles de stock',
        tone: this.lowStockCount() > 0 ? 'amber' : 'emerald',
        art: 'shield'
      });
    }

    if (this.canViewMovements() || this.canViewAssignments()) {
      cards.push({
        label: 'Actividad reciente',
        value: this.formatNumber(this.recentActivityCount()),
        helper: `Movimientos y asignaciones en ${this.activityWindowDays} dias`,
        tone: this.recentActivityCount() > 0 ? 'gold' : 'slate',
        art: 'chart'
      });
    }

    return cards.slice(0, 4);
  });

  protected readonly roomBreakdown = computed<DashboardBreakdownItem[]>(() => {
    if (!this.canViewRooms()) {
      return [];
    }

    const totalRooms = this.visibleRoomsCount();

    if (!totalRooms) {
      return [];
    }

    return [
      {
        label: 'Disponibles',
        value: this.availableRoomsCount(),
        share: this.calculateShare(this.availableRoomsCount(), totalRooms),
        helper: 'Listas para operacion inmediata',
        tone: 'emerald'
      },
      {
        label: 'Comprometidas',
        value: this.committedRoomsCount(),
        share: this.calculateShare(this.committedRoomsCount(), totalRooms),
        helper:
          this.committedRoomsCount() > 0 ? 'En uso o bajo atencion' : 'Sin presion operativa hoy',
        tone: this.committedRoomsCount() > 0 ? 'gold' : 'slate'
      },
      {
        label: 'Inactivas',
        value: this.inactiveRoomsCount(),
        share: this.calculateShare(this.inactiveRoomsCount(), totalRooms),
        helper:
          this.inactiveRoomsCount() > 0 ? 'Fuera de circulacion' : 'Sin habitaciones inactivas',
        tone: this.inactiveRoomsCount() > 0 ? 'slate' : 'emerald'
      }
    ];
  });

  protected readonly roomPanoramaChart = computed(() => {
    const totalRooms = this.visibleRoomsCount();

    if (!totalRooms) {
      return 'conic-gradient(from -90deg, #ede7dc 0 100%)';
    }

    const availableShare = this.calculateShare(this.availableRoomsCount(), totalRooms);
    const committedShare = this.calculateShare(this.committedRoomsCount(), totalRooms);
    const committedStop = availableShare + committedShare;

    return `conic-gradient(from -90deg, #63b97c 0 ${availableShare}%, #d9b86f ${availableShare}% ${committedStop}%, #ddd5c9 ${committedStop}% 100%)`;
  });

  protected readonly operationalHighlightTitle = computed(() => {
    if (this.openAlertsCount() > 0) {
      return `${this.formatNumber(this.openAlertsCount())} alertas requieren revision`;
    }

    if (this.committedRoomsCount() > 0) {
      return `${this.formatNumber(this.committedRoomsCount())} habitaciones siguen comprometidas`;
    }

    if (this.lowStockCount() > 0) {
      return `${this.formatNumber(this.lowStockCount())} insumos bajo seguimiento`;
    }

    return 'Operacion en equilibrio';
  });

  protected readonly operationalHighlightText = computed(() => {
    if (this.openAlertsCount() > 0) {
      return 'Conviene revisar los insumos criticos antes de que impacten la operacion diaria.';
    }

    if (this.committedRoomsCount() > 0) {
      return `Aun quedan ${this.formatNumber(this.availableRoomsCount())} habitaciones listas para atencion inmediata.`;
    }

    if (this.lowStockCount() > 0) {
      return 'La cobertura sigue controlada, pero hay puntos de reposicion que no conviene dejar crecer.';
    }

    return 'Inventario, habitaciones y actividad reciente se mantienen dentro de una lectura estable.';
  });

  protected readonly importantToday = computed<DashboardInsight[]>(() => {
    const insights: DashboardInsight[] = [];

    if (this.canViewAlerts()) {
      insights.push(
        this.openAlertsCount() > 0
          ? {
              title: `${this.formatNumber(this.openAlertsCount())} alertas abiertas`,
              text: 'Hay insumos con seguimiento pendiente por debajo del minimo visible.',
              tone: 'rose',
              art: 'bell'
            }
          : {
              title: 'Operacion estable',
              text: 'No hay alertas abiertas en el sistema.',
              tone: 'emerald',
              art: 'shield'
            }
      );
    }

    if (this.canViewInventory()) {
      insights.push(
        this.lowStockCount() > 0
          ? {
              title: 'Cobertura en seguimiento',
              text: `${this.formatNumber(this.stableItemsCount())} de ${this.formatNumber(this.activeItemsCount())} insumos activos siguen sobre minimo.`,
              tone: this.inventoryHealthTone(),
              art: 'box'
            }
          : {
              title: 'Cobertura estable',
              text: `Los ${this.formatNumber(this.activeItemsCount())} insumos activos visibles mantienen stock suficiente.`,
              tone: 'emerald',
              art: 'box'
            }
      );
    }

    if (this.canViewRooms()) {
      insights.push(
        this.committedRoomsCount() > 0
          ? {
              title: `${this.formatNumber(this.committedRoomsCount())} habitaciones comprometidas`,
              text: `Se encuentran en uso o en atencion, mientras ${this.formatNumber(this.availableRoomsCount())} siguen disponibles.`,
              tone: 'gold',
              art: 'door'
            }
          : {
              title: 'Disponibilidad despejada',
              text: `Las ${this.formatNumber(this.availableRoomsCount())} habitaciones activas estan listas para operar.`,
              tone: 'emerald',
              art: 'bed'
            }
      );
    }

    if (this.canViewAssignments()) {
      insights.push(
        this.todayAssignmentsCount() > 0
          ? {
              title: `${this.formatNumber(this.todayAssignmentsCount())} asignaciones hoy`,
              text: 'Hay nuevas entregas registradas en la fecha actual.',
              tone: 'gold',
              art: 'clipboard'
            }
          : {
              title: 'Sin asignaciones nuevas',
              text: 'No hay entregas registradas hoy.',
              tone: 'slate',
              art: 'clipboard'
            }
      );
    }

    if (this.canViewUsers() && insights.length < 4) {
      insights.push({
        title: `${this.formatNumber(this.activeUsersCount())} usuarios activos`,
        text: 'El equipo habilitado para operar se mantiene disponible.',
        tone: 'slate',
        art: 'chart'
      });
    }

    return insights.slice(0, 4);
  });

  protected readonly movementItems = computed<DashboardActivityItem[]>(() =>
    this.snapshot()
      .movements
      .slice()
      .sort((left, right) => this.toTimestamp(right.createdAt) - this.toTimestamp(left.createdAt))
      .slice(0, 4)
      .map((movement) => ({
        id: movement.id,
        title: movement.itemName,
        detail: this.formatMovementDetail(movement),
        badge: `${this.formatNumber(movement.quantity)} uds`,
        stamp: this.formatDateTime(movement.createdAt)
      }))
  );

  protected readonly assignmentItems = computed<DashboardActivityItem[]>(() =>
    this.snapshot()
      .assignments
      .slice()
      .sort((left, right) => this.toTimestamp(right.createdAt) - this.toTimestamp(left.createdAt))
      .slice(0, 4)
      .map((assignment) => ({
        id: assignment.id,
        title: assignment.itemName,
        detail: this.formatAssignmentDetail(assignment),
        badge: `${this.formatNumber(assignment.quantity)} uds`,
        stamp: this.formatDateTime(assignment.createdAt)
      }))
  );

  protected readonly statusBanner = computed<DashboardStatusBanner>(() => {
    if (this.openAlertsCount() > 0) {
      if (this.canViewInventory() && this.canViewRooms()) {
        return {
          title: 'Hay frentes que conviene revisar hoy',
          text: `${this.formatNumber(this.openAlertsCount())} alertas abiertas y ${this.formatNumber(this.committedRoomsCount())} habitaciones comprometidas mantienen la operacion bajo seguimiento.`,
          tone: 'rose'
        };
      }

      if (this.canViewInventory()) {
        return {
          title: 'Hay frentes que conviene revisar hoy',
          text: `${this.formatNumber(this.openAlertsCount())} alertas abiertas mantienen el inventario visible bajo seguimiento.`,
          tone: 'rose'
        };
      }

      return {
        title: 'Hay frentes que conviene revisar hoy',
        text: 'La operacion requiere seguimiento porque hay eventos activos que todavia no se han resuelto.',
        tone: 'rose'
      };
    }

    if (this.lowStockCount() > 0 || this.committedRoomsCount() > 0) {
      if (this.canViewInventory() && this.canViewRooms()) {
        return {
          title: 'El sistema se mantiene estable',
          text: `${this.formatNumber(this.availableRoomsCount())} habitaciones siguen disponibles y el inventario conserva ${this.inventoryCoveragePercentage()}% de cobertura visible.`,
          tone: this.committedRoomsCount() > 0 ? 'gold' : 'amber'
        };
      }

      if (this.canViewInventory()) {
        return {
          title: 'El sistema se mantiene estable',
          text: `La cobertura visible se mantiene en ${this.inventoryCoveragePercentage()}% con ${this.formatNumber(this.lowStockCount())} insumos bajo seguimiento.`,
          tone: 'amber'
        };
      }

      if (this.canViewRooms()) {
        return {
          title: 'El sistema se mantiene estable',
          text: `${this.formatNumber(this.availableRoomsCount())} habitaciones siguen disponibles y ${this.formatNumber(this.committedRoomsCount())} permanecen comprometidas.`,
          tone: 'gold'
        };
      }

      return {
        title: 'El sistema se mantiene estable',
        text: `La actividad reciente permanece bajo control dentro de la ventana de ${this.activityWindowDays} dias.`,
        tone: 'gold'
      };
    }

    if (this.canViewInventory() && !this.canViewRooms()) {
      return {
        title: 'Todo en orden por ahora',
        text: `El inventario visible se mantiene estable con ${this.inventoryCoveragePercentage()}% de cobertura y sin alertas abiertas.`,
        tone: 'emerald'
      };
    }

    if (this.canViewRooms() && !this.canViewInventory()) {
      return {
        title: 'Todo en orden por ahora',
        text: `${this.formatNumber(this.availableRoomsCount())} habitaciones se mantienen disponibles en la vista actual.`,
        tone: 'emerald'
      };
    }

    return {
      title: 'Todo en orden por ahora',
      text: 'Inventario, habitaciones y actividad reciente se mantienen estables dentro de la vista actual.',
      tone: 'emerald'
    };
  });

  protected readonly bannerLeftArt = computed<DashboardArt>(() => 'door');

  protected readonly bannerRightArt = computed<DashboardArt>(() => 'clipboard');

  ngOnInit(): void {
    this.loadDashboard();
  }

  protected formatNumber(value: number): string {
    return this.numberFormatter.format(value);
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

  private formatMovementDetail(movement: InventoryMovement): string {
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

    return fragments.join(' | ');
  }

  private formatAssignmentDetail(assignment: RoomSupplyAssignment): string {
    const fragments = [`Hab. ${assignment.roomNumber}`, this.formatLabel(assignment.assignmentType)];

    if (assignment.guestName) {
      fragments.push(assignment.guestName);
    }

    fragments.push(`Entrega: ${assignment.deliveredBy}`);

    return fragments.join(' | ');
  }

  private calculateShare(value: number, total: number): number {
    if (!total) {
      return 0;
    }

    return Math.round((value / total) * 100);
  }

  private formatDateTime(value: string): string {
    return this.dateTimeFormatter.format(new Date(value));
  }

  private isAvailableStatus(status: string | null | undefined): boolean {
    const normalized = this.normalizeValue(status);
    return normalized.includes('disponible') || normalized.includes('libre');
  }

  private formatLabel(value: string | null | undefined): string {
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

  private formatDisplayName(value: string): string {
    return value
      .replace(/[._-]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
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

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
