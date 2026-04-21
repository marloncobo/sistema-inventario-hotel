import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import type { InventoryMovement, MovementFilters } from '@models/inventory.model';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-movements-page',
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
  templateUrl: './movements-page.component.html'
})
export class MovementsPageComponent implements OnInit {
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly movements = signal<InventoryMovement[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly voidDialogVisible = signal(false);
  protected readonly selectedMovement = signal<InventoryMovement | null>(null);

  protected readonly filtersForm = this.fb.nonNullable.group({
    type: [''],
    origin: [''],
    roomNumber: [''],
    responsible: [''],
    operationalResponsible: [''],
    areaName: [''],
    startDate: [''],
    endDate: ['']
  });

  protected readonly voidForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(4)]]
  });

  protected readonly voidedCount = computed(
    () =>
      this.movements().filter((movement) =>
        ['ANULADO', 'VOIDED', 'VOID'].includes(movement.status.toUpperCase())
      ).length
  );

  ngOnInit(): void {
    this.loadMovements();
  }

  protected loadMovements(): void {
    this.loading.set(true);
    const raw = this.filtersForm.getRawValue();
    const filters: MovementFilters = {
      type: raw.type.trim() || null,
      origin: raw.origin.trim() || null,
      roomNumber: raw.roomNumber.trim() || null,
      responsible: raw.responsible.trim() || null,
      operationalResponsible: raw.operationalResponsible.trim() || null,
      areaName: raw.areaName.trim() || null,
      startDate: raw.startDate || null,
      endDate: raw.endDate || null
    };

    this.inventoryApi
      .getMovements(filters)
      .pipe(take(1))
      .subscribe({
        next: (movements) => {
          this.movements.set(movements);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  protected canVoid(movement: InventoryMovement): boolean {
    return !['ANULADO', 'VOIDED', 'VOID'].includes(movement.status.toUpperCase());
  }

  protected openVoidDialog(movement: InventoryMovement): void {
    this.selectedMovement.set(movement);
    this.voidForm.reset({ reason: '' });
    this.voidDialogVisible.set(true);
  }

  protected submitVoid(): void {
    const movement = this.selectedMovement();
    if (this.voidForm.invalid || !movement) {
      this.voidForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    this.inventoryApi
      .voidMovement(movement.id, { reason: this.voidForm.controls.reason.getRawValue().trim() })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.voidDialogVisible.set(false);
          this.selectedMovement.set(null);
          this.notificationService.success('Movimientos', 'Movimiento anulado.');
          this.loadMovements();
        },
        error: () => {
          this.saving.set(false);
        }
      });
  }

  protected formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  protected showVoidError(): boolean {
    const control = this.voidForm.controls.reason;
    return control.invalid && control.touched;
  }

  protected voidError(): string {
    const errors = this.voidForm.controls.reason.errors;
    if (errors?.['required']) {
      return 'Debes ingresar un motivo.';
    }

    if (errors?.['minlength']) {
      return 'Debe tener al menos 4 caracteres.';
    }

    return 'Valor invalido.';
  }
}
