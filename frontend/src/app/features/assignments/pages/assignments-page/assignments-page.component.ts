import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { catchError, forkJoin, of, startWith, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { AuthService } from '@core/services/auth.service';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { RoomsApiService } from '@core/services/api/rooms-api.service';
import { UsersApiService } from '@core/services/api/users-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiErrorMessage, extractApiFieldErrors } from '@models/api-error.model';
import type { AppUser } from '@models/app-user.model';
import type { SupplyItem } from '@models/inventory.model';
import type { AssignSupplyRequest, AssignmentFilters, Room, RoomSupplyAssignment } from '@models/room.model';
import { MinNumberDirective } from '@shared/directives/min-number.directive';
import { notBlankValidator } from '@shared/utils/app-validators.util';
import { applyServerValidationErrors } from '@shared/utils/form-errors.util';
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
    DialogModule,
    InputTextModule,
    MinNumberDirective,
    TableModule
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
  protected readonly submitError = signal<string | null>(null);
  protected readonly movementDialogVisible = signal(false);
  /** Vista activa cuando el usuario puede ver habitacion y global a la vez. */
  protected readonly catalogView = signal<'room' | 'global'>('room');

  protected readonly assignmentForm = this.fb.group({
    roomId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    itemId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    quantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    deliveredBy: this.fb.nonNullable.control('', [
      Validators.required,
      notBlankValidator,
      Validators.maxLength(120)
    ]),
    guestName: this.fb.control('', [Validators.maxLength(120)]),
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

  protected openMovementDialog(): void {
    this.submitError.set(null);
    this.movementDialogVisible.set(true);
  }

  protected onMovementDialogVisibleChange(visible: boolean): void {
    this.movementDialogVisible.set(visible);
    if (!visible) {
      this.submitError.set(null);
      this.assignmentForm.markAsUntouched();
    }
  }

  protected selectCatalogView(view: 'room' | 'global'): void {
    this.catalogView.set(view);
  }

  protected showAssignmentsCatalog(): boolean {
    return this.canBrowseRooms() || this.canLoadOverview();
  }

  protected showCatalogTabs(): boolean {
    return this.canBrowseRooms() && this.canLoadOverview();
  }

  protected showRoomHistoryPanel(): boolean {
    return this.canBrowseRooms() && (!this.canLoadOverview() || this.catalogView() === 'room');
  }

  protected showGlobalHistoryPanel(): boolean {
    return this.canLoadOverview() && (!this.canBrowseRooms() || this.catalogView() === 'global');
  }

  protected historyRoomNumber(): string | null {
    const id = this.historyForm.controls.roomId.getRawValue();
    const room = this.rooms().find((r) => r.id === id);
    return room ? room.number : null;
  }

  protected roomHistoryEmptyHint(): string {
    if (this.historyForm.controls.roomId.getRawValue() < 1) {
      return 'Elige una habitacion y pulsa Ver historial para llenar el catalogo.';
    }
    return 'Esta habitacion aun no registra movimientos en el sistema.';
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

          if (!result.rooms.length && this.canLoadOverview()) {
            this.catalogView.set('global');
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
    this.submitError.set(null);

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
          this.movementDialogVisible.set(false);
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
        error: (error) => {
          this.saving.set(false);
          const fieldErrors = extractApiFieldErrors(error.error);
          if (Object.keys(fieldErrors).length) {
            applyServerValidationErrors(this.assignmentForm, fieldErrors);
            this.submitError.set('Revisa los campos marcados antes de guardar.');
            return;
          }

          this.submitError.set(extractApiErrorMessage(error.error));
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
    controlName: 'roomId' | 'itemId' | 'quantity' | 'deliveredBy' | 'guestName'
  ): boolean {
    const control = this.assignmentForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected assignmentError(
    controlName: 'roomId' | 'itemId' | 'quantity' | 'deliveredBy' | 'guestName'
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

    if (errors['blank']) {
      return 'No puede quedar en blanco.';
    }

    if (errors['min']) {
      return 'Debes seleccionar un valor válido.';
    }

    return 'Valor inválido.';
  }
}
