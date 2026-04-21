import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { catchError, forkJoin, of, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ASSIGNMENT_TYPE_OPTIONS } from '@core/constants/domain-options';
import { AuthService } from '@core/services/auth.service';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { RoomsApiService } from '@core/services/api/rooms-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import type { SupplyItem } from '@models/inventory.model';
import type { AssignSupplyRequest, AssignmentFilters, Room, RoomSupplyAssignment } from '@models/room.model';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-assignments-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    EmptyStateComponent,
    PageHeaderComponent,
    TableModule,
    TagModule
  ],
  templateUrl: './assignments-page.component.html'
})
export class AssignmentsPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly assignmentTypes = ASSIGNMENT_TYPE_OPTIONS;
  protected readonly rooms = signal<Room[]>([]);
  protected readonly items = signal<SupplyItem[]>([]);
  protected readonly assignments = signal<RoomSupplyAssignment[]>([]);
  protected readonly roomHistory = signal<RoomSupplyAssignment[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly historyLoading = signal(false);
  protected readonly roomReferenceStatus = signal<string>('');

  protected readonly assignmentForm = this.fb.group({
    roomId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    roomReference: this.fb.control(''),
    itemId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    quantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    deliveredBy: this.fb.nonNullable.control('', [Validators.required]),
    guestName: this.fb.control(''),
    assignmentType: this.fb.nonNullable.control('MINIBAR', [Validators.required])
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

  protected readonly totalAssignedQuantity = computed(() =>
    this.assignments().reduce((total, entry) => total + entry.quantity, 0)
  );

  ngOnInit(): void {
    this.loadBaseData();
  }

  protected isServiceRole(): boolean {
    return this.authService.hasRole('SERVICIO');
  }

  protected canBrowseRooms(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'RECEPCION']);
  }

  protected canLoadOverview(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'RECEPCION']);
  }

  protected loadBaseData(): void {
    this.loading.set(true);

    const rooms$ = this.canBrowseRooms()
      ? this.roomsApi.getRooms().pipe(catchError(() => of([] as Room[])))
      : of([] as Room[]);

    const assignments$ = this.canLoadOverview()
      ? this.roomsApi.getAllAssignments({}).pipe(catchError(() => of([] as RoomSupplyAssignment[])))
      : of([] as RoomSupplyAssignment[]);

    forkJoin({
      rooms: rooms$,
      items: this.inventoryApi.getItems().pipe(catchError(() => of([] as SupplyItem[]))),
      assignments: assignments$
    })
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.rooms.set(result.rooms);
          this.items.set(result.items.filter((item) => item.active));
          this.assignments.set(result.assignments);
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

  protected validateRoomReference(): void {
    const reference = this.assignmentForm.controls.roomReference.getRawValue()?.trim();
    if (!reference) {
      this.roomReferenceStatus.set('');
      return;
    }

    this.roomsApi
      .getRoomByNumber(reference)
      .pipe(take(1))
      .subscribe({
        next: (room) => {
          this.roomReferenceStatus.set(
            `Habitacion ${room.number}: ${room.type}, ${room.status}, ${room.active ? 'activa' : 'inactiva'}.`
          );
        },
        error: () => {
          this.roomReferenceStatus.set('No se pudo validar la habitacion con el endpoint actual.');
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
          this.notificationService.success('Asignaciones', 'Asignacion registrada.');
          this.assignmentForm.reset({
            roomId: this.isServiceRole() ? 0 : raw.roomId,
            roomReference: '',
            itemId: 0,
            quantity: 1,
            deliveredBy: raw.deliveredBy,
            guestName: '',
            assignmentType: 'MINIBAR'
          });
          this.roomReferenceStatus.set('');
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
      return 'Valor invalido.';
    }

    if (errors['required']) {
      return 'Este campo es obligatorio.';
    }

    if (errors['min']) {
      return 'Debes seleccionar un valor valido.';
    }

    return 'Valor invalido.';
  }
}
