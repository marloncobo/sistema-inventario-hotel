import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { catchError, forkJoin, of, startWith, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import type { TableRowSelectEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ROOM_STATUS_OPTIONS, ROOM_TYPES } from '@core/constants/domain-options';
import { AuthService } from '@core/services/auth.service';
import { RoomsApiService } from '@core/services/api/rooms-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiErrorMessage, extractApiFieldErrors } from '@models/api-error.model';
import type { CreateRoomRequest, Room, RoomSupplyAssignment } from '@models/room.model';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { MinNumberDirective } from '@shared/directives/min-number.directive';
import { applyServerValidationErrors } from '@shared/utils/form-errors.util';

@Component({
  selector: 'app-rooms-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TableModule,
    EmptyStateComponent,
    TagModule,
    MinNumberDirective
  ],
  templateUrl: './rooms-page.component.html',
  styleUrls: ['./rooms-page.component.css', '../../../../shared/styles/premium-panels.css']
})
export class RoomsPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly roomTypes = ROOM_TYPES;
  protected readonly roomStatuses = ROOM_STATUS_OPTIONS;
  protected readonly rooms = signal<Room[]>([]);
  protected readonly selectedRoom = signal<Room | null>(null);
  protected readonly assignments = signal<RoomSupplyAssignment[]>([]);
  protected readonly loading = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly detailDialogVisible = signal(false);
  protected readonly createDialogVisible = signal(false);
  protected readonly statusDialogVisible = signal(false);
  protected readonly statusTargetRoom = signal<Room | null>(null);
  protected readonly createSubmitError = signal<string | null>(null);
  protected readonly statusSubmitError = signal<string | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 10;

  protected readonly filtersForm = this.fb.nonNullable.group({
    search: [''],
    status: [''],
    floor: ['']
  });

  private readonly filtersValue = toSignal(
    this.filtersForm.valueChanges.pipe(startWith(this.filtersForm.getRawValue())),
    { initialValue: this.filtersForm.getRawValue() }
  );

  protected readonly createForm = this.fb.group({
    number: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^\d{3}$/)]),
    type: this.fb.nonNullable.control('ESTANDAR', [Validators.required]),
    status: this.fb.nonNullable.control('DISPONIBLE', [Validators.required]),
    capacity: this.fb.nonNullable.control(2, [Validators.required, Validators.min(1)]),
    floor: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    observations: this.fb.control('', [Validators.maxLength(500)])
  });

  protected readonly statusForm = this.fb.nonNullable.group({
    status: ['DISPONIBLE', [Validators.required]]
  });

  protected readonly filteredRooms = computed(() => {
    const { search, status, floor } = this.filtersValue();
    const normalizedSearch = this.normalizeRoomLookup(search ?? '');
    const normalizedStatus = (status ?? '').trim().toUpperCase();
    const normalizedFloor = (floor ?? '').trim();

    return [...this.rooms()]
      .filter((room) => {
        const searchLabel =
          `${room.number} ${this.roomTypeLabel(room.type)} ${room.floor} ${room.capacity}`.toLowerCase();
        const matchesSearch = !normalizedSearch || searchLabel.includes(normalizedSearch);
        const matchesStatus = !normalizedStatus || room.status === normalizedStatus;
        const matchesFloor = !normalizedFloor || `${room.floor}` === normalizedFloor;

        return matchesSearch && matchesStatus && matchesFloor;
      })
      .sort((left, right) => this.compareRooms(left, right));
  });

  protected readonly paginatedRooms = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredRooms().slice(start, start + this.pageSize);
  });

  protected readonly floorOptions = computed(() =>
    Array.from(new Set(this.rooms().map((room) => room.floor))).sort((left, right) => left - right)
  );

  protected readonly totalCount = computed(() => this.rooms().length);
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRooms().length / this.pageSize))
  );
  protected readonly pageStart = computed(() =>
    this.filteredRooms().length ? (this.currentPage() - 1) * this.pageSize + 1 : 0
  );
  protected readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.filteredRooms().length)
  );
  protected readonly visiblePages = computed(() => {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const maxButtons = 5;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  });

  protected readonly orderedAssignments = computed(() =>
    [...this.assignments()].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
  );

  protected readonly recentAssignments = computed(() => this.orderedAssignments().slice(0, 6));

  private readonly resetPageWhenFiltersChange = effect(() => {
    this.filtersValue();
    this.currentPage.set(1);
  });

  private readonly clampCurrentPage = effect(() => {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    if (currentPage > totalPages) {
      this.currentPage.set(totalPages);
    }
  });

  ngOnInit(): void {
    this.loadRooms();
  }

  protected canCreate(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  protected canUpdateStatus(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'RECEPCION']);
  }

  protected loadRooms(): void {
    this.loading.set(true);
    this.roomsApi
      .getRooms()
      .pipe(take(1))
      .subscribe({
        next: (rooms) => {
          this.rooms.set(rooms);

          const currentSelectedRoomId = this.selectedRoom()?.id;
          if (currentSelectedRoomId) {
            const refreshedSelection = rooms.find((room) => room.id === currentSelectedRoomId) ?? null;
            this.selectedRoom.set(refreshedSelection);
            if (!refreshedSelection) {
              this.assignments.set([]);
            }
          }

          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  protected clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      status: '',
      floor: ''
    });
  }

  protected onRoomRowSelect(event: TableRowSelectEvent<Room>): void {
    const row = event.data;
    if (!row || Array.isArray(row)) {
      return;
    }

    this.selectRoom(row.id);
  }

  protected selectRoom(id: number): void {
    if (!id) {
      return;
    }

    this.detailDialogVisible.set(true);
    this.detailLoading.set(true);
    forkJoin({
      room: this.roomsApi.getRoom(id).pipe(catchError(() => of(null))),
      assignments: this.roomsApi
        .getRoomAssignments(id)
        .pipe(catchError(() => of([] as RoomSupplyAssignment[])))
    })
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.selectedRoom.set(result.room);
          this.assignments.set(result.assignments);

          if (result.room) {
            this.currentPage.set(this.resolvePageForRoom(result.room.id));
          }

          this.detailLoading.set(false);
        },
        error: () => {
          this.detailLoading.set(false);
        }
      });
  }

  protected changePage(page: number): void {
    const safePage = Math.min(Math.max(page, 1), this.totalPages());
    this.currentPage.set(safePage);
  }

  protected openCreateDialog(): void {
    if (!this.canCreate()) {
      return;
    }

    this.createSubmitError.set(null);
    this.createForm.reset({
      number: '',
      type: 'ESTANDAR',
      status: 'DISPONIBLE',
      capacity: 2,
      floor: 1,
      observations: ''
    });
    this.createDialogVisible.set(true);
  }

  protected submitCreate(): void {
    if (!this.canCreate()) {
      return;
    }

    this.createSubmitError.set(null);
    this.clearCustomCreateError('capacity', 'familyCapacity');

    const raw = this.createForm.getRawValue();
    if (raw.type === 'FAMILIAR' && raw.capacity < 3) {
      this.createForm.controls.capacity.setErrors({
        ...(this.createForm.controls.capacity.errors ?? {}),
        familyCapacity: true
      });
      this.createForm.controls.capacity.markAsTouched();
    }

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const payload: CreateRoomRequest = {
      number: raw.number.trim(),
      type: raw.type,
      status: raw.status,
      capacity: raw.capacity,
      floor: raw.floor,
      observations: raw.observations?.trim() || null
    };

    this.roomsApi
      .createRoom(payload)
      .pipe(take(1))
      .subscribe({
        next: (room) => {
          this.saving.set(false);
          this.createDialogVisible.set(false);
          this.detailDialogVisible.set(true);
          this.notificationService.success('Habitaciones', 'Habitación creada.');
          this.focusRoom(room);
          this.selectedRoom.set(room);
          this.assignments.set([]);
          this.loadRooms();
        },
      error: (error) => {
        this.saving.set(false);
        const fieldErrors = extractApiFieldErrors(error.error);
        if (Object.keys(fieldErrors).length) {
          applyServerValidationErrors(this.createForm, fieldErrors);
          this.createSubmitError.set('Revisa los campos marcados antes de guardar.');
          return;
        }

        const message = extractApiErrorMessage(error.error);
        this.createSubmitError.set(message);
        if (message.toLowerCase().includes('numero')) {
          this.createForm.controls.number.setErrors({
            ...(this.createForm.controls.number.errors ?? {}),
            server: message
          });
          this.createForm.controls.number.markAsTouched();
        }
      }
    });
  }

  protected openStatusDialog(room: Room): void {
    if (!this.canUpdateStatus()) {
      return;
    }

    this.statusSubmitError.set(null);
    this.statusTargetRoom.set(room);
    this.statusForm.reset({ status: room.status });
    this.statusDialogVisible.set(true);
  }

  protected submitStatus(): void {
    if (!this.canUpdateStatus()) {
      return;
    }

    this.statusSubmitError.set(null);
    const room = this.statusTargetRoom();
    if (this.statusForm.invalid || !room) {
      this.statusForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.roomsApi
      .updateRoomStatus(room.id, { status: this.statusForm.controls.status.getRawValue() })
      .pipe(take(1))
      .subscribe({
        next: (updatedRoom) => {
          this.saving.set(false);
          this.statusDialogVisible.set(false);
          this.statusTargetRoom.set(null);
          this.notificationService.success('Habitaciones', 'Estado actualizado.');
          this.loadRooms();

          if (this.selectedRoom()?.id === updatedRoom.id) {
            this.selectRoom(updatedRoom.id);
          }
        },
        error: (error) => {
          this.saving.set(false);
          this.statusSubmitError.set(extractApiErrorMessage(error.error));
        }
      });
  }

  protected formatDate(value: string): string {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

  protected roomStatusLabel(status: string): string {
    return this.formatLabel(status);
  }

  protected roomTypeLabel(type: string): string {
    return this.formatLabel(type);
  }

  protected assignmentFlowLabel(value: string | null | undefined): string {
    return value === 'HABITACION' ? 'Entrada' : 'Salida';
  }

  protected assignmentFlowSeverity(value: string | null | undefined): 'info' | 'warn' {
    return value === 'HABITACION' ? 'info' : 'warn';
  }

  protected showCreateError(
    controlName: 'number' | 'type' | 'status' | 'capacity' | 'floor' | 'observations'
  ): boolean {
    const control = this.createForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected createError(
    controlName: 'number' | 'type' | 'status' | 'capacity' | 'floor' | 'observations'
  ): string {
    return this.resolveControlError(this.createForm.controls[controlName].errors);
  }

  private focusRoom(room: Room): void {
    this.filtersForm.patchValue({
      search: room.number,
      status: '',
      floor: ''
    });
    this.currentPage.set(1);
  }

  private resolvePageForRoom(roomId: number): number {
    const roomIndex = this.filteredRooms().findIndex((room) => room.id === roomId);
    return roomIndex === -1 ? 1 : Math.floor(roomIndex / this.pageSize) + 1;
  }

  private normalizeRoomLookup(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/^hab\.?\s*/i, '');
  }

  private formatLabel(value: string): string {
    const normalized = value.toLowerCase().replace(/_/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private clearCustomCreateError(
    controlName: 'capacity',
    errorKey: 'familyCapacity'
  ): void {
    const control = this.createForm.controls[controlName];
    if (!control.errors?.[errorKey]) {
      return;
    }

    const { [errorKey]: _removed, ...rest } = control.errors;
    control.setErrors(Object.keys(rest).length ? rest : null);
  }

  private resolveControlError(errors: ValidationErrors | null): string {
    if (!errors) {
      return 'Valor invalido.';
    }

    if (typeof errors['server'] === 'string') {
      return errors['server'] as string;
    }

    if (errors['required']) {
      return 'Este campo es obligatorio.';
    }

    if (errors['pattern']) {
      return 'Debe tener exactamente 3 digitos.';
    }

    if (errors['min']) {
      return 'Debe ser mayor o igual al minimo permitido.';
    }

    if (errors['familyCapacity']) {
      return 'La habitación familiar debe tener capacidad mínima de 3 personas.';
    }

    if (errors['maxlength']) {
      return `No puede superar ${errors['maxlength'].requiredLength} caracteres.`;
    }

    return 'Valor invalido.';
  }

  private compareRooms(left: Room, right: Room): number {
    const floorDifference = left.floor - right.floor;
    if (floorDifference !== 0) {
      return floorDifference;
    }

    return left.number.localeCompare(right.number, undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  }
}
