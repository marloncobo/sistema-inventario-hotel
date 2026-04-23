import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { catchError, forkJoin, of, startWith, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuthService } from '@core/services/auth.service';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { RoomsApiService } from '@core/services/api/rooms-api.service';
import { UsersApiService } from '@core/services/api/users-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import type { AppUser } from '@models/app-user.model';
import type { SupplyItem } from '@models/inventory.model';
import type { AssignSupplyRequest, AssignmentFilters, Room, RoomSupplyAssignment } from '@models/room.model';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
const ASSIGNMENT_FLOW_OPTIONS = [
  { label: 'Salida', value: 'SERVICIO_HABITACION' },
  { label: 'Entrada', value: 'HABITACION' }
] as const;

@Component({
  selector: 'app-assignments-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    EmptyStateComponent,
    TableModule,
    TagModule
  ],
  templateUrl: './assignments-page.component.html',
  styleUrls: ['./assignments-page.component.css', '../../../../shared/styles/premium-panels.css']
})
export class AssignmentsPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly assignmentFlows = ASSIGNMENT_FLOW_OPTIONS;
  protected readonly rooms = signal<Room[]>([]);
  protected readonly items = signal<SupplyItem[]>([]);
  protected readonly serviceUsers = signal<AppUser[]>([]);
  protected readonly assignments = signal<RoomSupplyAssignment[]>([]);
  protected readonly roomHistory = signal<RoomSupplyAssignment[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly historyLoading = signal(false);

  protected readonly assignmentForm = this.fb.group({
    roomId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    itemId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    quantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    deliveredBy: this.fb.nonNullable.control('', [Validators.required]),
    guestName: this.fb.control(''),
    assignmentType: this.fb.nonNullable.control('SERVICIO_HABITACION', [Validators.required])
  });

  protected readonly filtersForm = this.fb.nonNullable.group({
    roomNumber: [''],
    assignmentType: [''],
    startDate: [''],
    endDate: ['']
  });

  protected readonly historyForm = this.fb.nonNullable.group({
    roomId: [0]
  });
  protected readonly overviewFiltersValue = toSignal(
    this.filtersForm.valueChanges.pipe(startWith(this.filtersForm.getRawValue())),
    { initialValue: this.filtersForm.getRawValue() }
  );

  protected readonly totalAssignedQuantity = computed(() =>
    this.assignments().reduce((total, entry) => total + entry.quantity, 0)
  );
  protected readonly outgoingAssignmentsCount = computed(
    () => this.assignments().filter((entry) => entry.assignmentType !== 'HABITACION').length
  );
  protected readonly incomingAssignmentsCount = computed(
    () => this.assignments().filter((entry) => entry.assignmentType === 'HABITACION').length
  );
  protected readonly activeOverviewFilters = computed(() => {
    const filters = this.overviewFiltersValue();
    const chips: string[] = [];
    const roomNumber = filters.roomNumber?.trim() ?? '';

    if (roomNumber) {
      chips.push(`Habitacion: ${roomNumber}`);
    }

    if (filters.assignmentType) {
      chips.push(`Movimiento: ${this.flowLabel(filters.assignmentType)}`);
    }

    if (filters.startDate) {
      chips.push(`Desde: ${filters.startDate}`);
    }

    if (filters.endDate) {
      chips.push(`Hasta: ${filters.endDate}`);
    }

    return chips;
  });
  protected readonly activeOverviewFilterCount = computed(() => this.activeOverviewFilters().length);

  ngOnInit(): void {
    this.loadBaseData();
  }

  protected isServiceRole(): boolean {
    return this.authService.hasRole('SERVICIO');
  }

  protected canBrowseRooms(): boolean {
    return this.rooms().length > 0;
  }

  protected canLoadOverview(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'RECEPCION']);
  }

  protected loadBaseData(): void {
    this.loading.set(true);

    const assignments$ = this.canLoadOverview()
      ? this.roomsApi.getAllAssignments({}).pipe(catchError(() => of([] as RoomSupplyAssignment[])))
      : of([] as RoomSupplyAssignment[]);

    forkJoin({
      rooms: this.roomsApi.getRooms().pipe(catchError(() => of([] as Room[]))),
      items: this.inventoryApi.getItems().pipe(catchError(() => of([] as SupplyItem[]))),
      assignments: assignments$,
      users: this.usersApi.getUsers().pipe(catchError(() => of([] as AppUser[])))
    })
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.rooms.set(result.rooms);
          this.items.set(result.items.filter((item) => item.active));
          this.assignments.set(result.assignments);

          const serviceUsers = result.users.filter(
            (user) => user.active && user.roles.includes('SERVICIO')
          );

          this.serviceUsers.set(
            serviceUsers.length
              ? serviceUsers
              : this.isServiceRole()
                ? [
                    {
                      id: 0,
                      username: this.authService.username(),
                      roles: ['SERVICIO'],
                      active: true
                    }
                  ]
                : []
          );

          if (!this.assignmentForm.controls.deliveredBy.getRawValue() && this.serviceUsers().length) {
            this.assignmentForm.controls.deliveredBy.setValue(this.serviceUsers()[0]!.username);
          }

          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  protected loadAssignments(): void {
    if (!this.canLoadOverview()) {
      return;
    }

    this.loading.set(true);
    const raw = this.filtersForm.getRawValue();
    const filters: AssignmentFilters = {
      roomNumber: raw.roomNumber.trim() || null,
      assignmentType: raw.assignmentType || null,
      startDate: raw.startDate || null,
      endDate: raw.endDate || null
    };

    this.roomsApi
      .getAllAssignments(filters)
      .pipe(take(1))
      .subscribe({
        next: (assignments) => {
          this.assignments.set(assignments);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  protected loadRoomHistory(): void {
    const roomId = this.historyForm.controls.roomId.getRawValue();
    if (roomId < 1) {
      return;
    }

    this.historyLoading.set(true);
    this.roomsApi
      .getRoomAssignments(roomId)
      .pipe(take(1))
      .subscribe({
        next: (history) => {
          this.roomHistory.set(history);
          this.historyLoading.set(false);
        },
        error: () => {
          this.historyLoading.set(false);
        }
      });
  }

  protected submitAssignment(): void {
    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.assignmentForm.getRawValue();
    const payload: AssignSupplyRequest = {
      itemId: raw.itemId,
      quantity: raw.quantity,
      deliveredBy: raw.deliveredBy.trim(),
      guestName: raw.guestName?.trim() || null,
      assignmentType: raw.assignmentType || null
    };

    this.roomsApi
      .assignSupply(raw.roomId, payload)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notificationService.success('Asignaciones', 'Asignación registrada.');
          this.assignmentForm.reset({
            roomId: this.isServiceRole() ? 0 : raw.roomId,
            itemId: 0,
            quantity: 1,
            deliveredBy: raw.deliveredBy,
            guestName: '',
            assignmentType: raw.assignmentType
          });
          this.loadBaseData();
          if (this.canBrowseRooms() && this.historyForm.controls.roomId.getRawValue() > 0) {
            this.loadRoomHistory();
          }
        },
        error: () => {
          this.saving.set(false);
        }
      });
  }

  protected formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  protected roomLabel(room: Room): string {
    return `${room.number} · ${room.type} · ${room.status}`;
  }

  protected itemLabel(item: SupplyItem): string {
    return `${item.code} · ${item.name}`;
  }

  protected flowLabel(value: string | null | undefined): string {
    if (value === 'HABITACION') {
      return 'Entrada';
    }

    return 'Salida';
  }

  protected flowSeverity(value: string | null | undefined): 'info' | 'warn' {
    if (value === 'HABITACION') {
      return 'info';
    }

    return 'warn';
  }

  protected clearOverviewFilters(): void {
    this.filtersForm.reset({
      roomNumber: '',
      assignmentType: '',
      startDate: '',
      endDate: ''
    });
    this.loadAssignments();
  }

  protected showAssignmentError(
    controlName: 'roomId' | 'itemId' | 'quantity' | 'deliveredBy'
  ): boolean {
    const control = this.assignmentForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected assignmentError(
    controlName: 'roomId' | 'itemId' | 'quantity' | 'deliveredBy'
  ): string {
    return this.resolveControlError(this.assignmentForm.controls[controlName].errors);
  }

  private resolveControlError(errors: ValidationErrors | null): string {
    if (!errors) {
      return 'Valor inválido.';
    }

    if (errors['required']) {
      return 'Este campo es obligatorio.';
    }

    if (errors['min']) {
      return 'Debes seleccionar un valor válido.';
    }

    return 'Valor inválido.';
  }
}
