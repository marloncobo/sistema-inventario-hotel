import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { catchError, forkJoin, of, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ROOM_STATUS_OPTIONS, ROOM_TYPES } from '@core/constants/domain-options';
import { AuthService } from '@core/services/auth.service';
import { RoomsApiService } from '@core/services/api/rooms-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiFieldErrors } from '@models/api-error.model';
import type { CreateRoomRequest, Room, RoomSupplyAssignment } from '@models/room.model';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
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
    EmptyStateComponent,
    PageHeaderComponent,
    TableModule,
    TagModule
  ],
  templateUrl: './rooms-page.component.html'
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
  protected readonly createDialogVisible = signal(false);
  protected readonly statusDialogVisible = signal(false);

  protected readonly createForm = this.fb.group({
    number: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^\d{3}$/)]),
    type: this.fb.nonNullable.control('ESTANDAR', [Validators.required]),
    status: this.fb.nonNullable.control('DISPONIBLE', [Validators.required]),
    capacity: this.fb.nonNullable.control(2, [Validators.required, Validators.min(1)]),
    floor: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    observations: this.fb.control('')
  });

  protected readonly statusForm = this.fb.nonNullable.group({
    status: ['DISPONIBLE', [Validators.required]]
  });

  protected readonly availableCount = computed(
    () => this.rooms().filter((room) => room.status === 'DISPONIBLE').length
  );

  protected readonly activeCount = computed(
    () => this.rooms().filter((room) => room.active).length
  );

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
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  protected selectRoom(id: number): void {
    this.detailLoading.set(true);
    forkJoin({
      room: this.roomsApi.getRoom(id).pipe(catchError(() => of(null))),
      assignments: this.roomsApi.getRoomAssignments(id).pipe(catchError(() => of([] as RoomSupplyAssignment[])))
    })
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.selectedRoom.set(result.room);
          this.assignments.set(result.assignments);
          this.detailLoading.set(false);
        },
        error: () => {
          this.detailLoading.set(false);
        }
      });
  }

  protected openCreateDialog(): void {
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
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.createForm.getRawValue();
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
          this.notificationService.success('Habitaciones', 'Habitacion creada.');
          this.loadRooms();
          this.selectedRoom.set(room);
        },
        error: (error) => {
          this.saving.set(false);
          applyServerValidationErrors(this.createForm, extractApiFieldErrors(error.error));
        }
      });
  }

  protected openStatusDialog(room: Room): void {
    this.selectedRoom.set(room);
    this.statusForm.reset({ status: room.status });
    this.statusDialogVisible.set(true);
  }

  protected submitStatus(): void {
    const room = this.selectedRoom();
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
          this.notificationService.success('Habitaciones', 'Estado actualizado.');
          this.loadRooms();
          this.selectRoom(updatedRoom.id);
        },
        error: () => {
          this.saving.set(false);
        }
      });
  }

  protected formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  protected showCreateError(
    controlName: 'number' | 'type' | 'status' | 'capacity' | 'floor'
  ): boolean {
    const control = this.createForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected createError(
    controlName: 'number' | 'type' | 'status' | 'capacity' | 'floor'
  ): string {
    return this.resolveControlError(this.createForm.controls[controlName].errors);
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

    return 'Valor invalido.';
  }
}
