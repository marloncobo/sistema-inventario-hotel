import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { UsersApiService } from '@core/services/api/users-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import type { AppUser } from '@models/app-user.model';
import type { InventoryMovement, MovementFilters } from '@models/inventory.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-movements-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PageHeaderComponent,
    TableModule
  ],
  templateUrl: './movements-page.component.html',
  styleUrls: ['./movements-page.component.css']
})
export class MovementsPageComponent implements OnInit {
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly numberFormatter = new Intl.NumberFormat('es-CO');
  private readonly dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  protected readonly movements = signal<InventoryMovement[]>([]);
  protected readonly filterSourceMovements = signal<InventoryMovement[]>([]);
  protected readonly serviceUsers = signal<AppUser[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly voidDialogVisible = signal(false);
  protected readonly selectedMovement = signal<InventoryMovement | null>(null);
  protected readonly advancedFiltersVisible = signal(false);

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
  protected readonly filtersValue = toSignal(
    this.filtersForm.valueChanges.pipe(startWith(this.filtersForm.getRawValue())),
    { initialValue: this.filtersForm.getRawValue() }
  );

  protected readonly voidForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(4)]]
  });

  protected readonly voidedCount = computed(
    () =>
      this.movements().filter((movement) =>
        ['ANULADO', 'VOIDED', 'VOID'].includes(movement.status.toUpperCase())
      ).length
  );
  protected readonly entryCount = computed(
    () => this.movements().filter((movement) => this.movementTypeLabel(movement) === 'Entrada').length
  );
  protected readonly exitCount = computed(
    () => this.movements().filter((movement) => this.movementTypeLabel(movement) === 'Salida').length
  );
  protected readonly roomOptions = computed(() =>
    this.uniqueSorted(this.optionSource().map((movement) => movement.roomNumber))
  );
  protected readonly areaOptions = computed(() =>
    this.uniqueSorted(this.optionSource().map((movement) => movement.areaName))
  );
  protected readonly responsibleOptions = computed(() =>
    this.uniqueSorted([
      ...this.optionSource().map((movement) => movement.responsible),
      ...this.serviceUsers().map((user) => user.username)
    ])
  );
  protected readonly operationalResponsibleOptions = computed(() =>
    this.uniqueSorted([
      ...this.optionSource().map((movement) => movement.operationalResponsible),
      ...this.serviceUsers().map((user) => user.username)
    ])
  );
  protected readonly typeOptions = computed<SelectOption[]>(() =>
    this.buildOptions(this.optionSource().map((movement) => movement.movementType))
  );
  protected readonly originOptions = computed<SelectOption[]>(() =>
    this.buildOptions(this.optionSource().map((movement) => movement.origin))
  );
  protected readonly activeFilterChips = computed(() => {
    const filters = this.filtersValue();
    const chips: string[] = [];
    const type = filters.type?.trim() || '';
    const origin = filters.origin?.trim() || '';
    const roomNumber = filters.roomNumber?.trim() || '';
    const responsible = filters.responsible?.trim() || '';
    const operationalResponsible = filters.operationalResponsible?.trim() || '';
    const areaName = filters.areaName?.trim() || '';

    if (type) {
      chips.push(`Tipo: ${type}`);
    }

    if (origin) {
      chips.push(`Origen: ${origin}`);
    }

    if (roomNumber) {
      chips.push(`Habitacion: ${roomNumber}`);
    }

    if (responsible) {
      chips.push(`Responsable: ${responsible}`);
    }

    if (operationalResponsible) {
      chips.push(`Responsable operativo: ${operationalResponsible}`);
    }

    if (areaName) {
      chips.push(`Area: ${areaName}`);
    }

    if (filters.startDate) {
      chips.push(`Desde: ${filters.startDate}`);
    }

    if (filters.endDate) {
      chips.push(`Hasta: ${filters.endDate}`);
    }

    return chips;
  });
  protected readonly activeFilterCount = computed(() => this.activeFilterChips().length);
  protected readonly advancedFilterCount = computed(() => {
    const filters = this.filtersValue();
    let count = 0;

    if (filters.type?.trim()) {
      count += 1;
    }

    if (filters.origin?.trim()) {
      count += 1;
    }

    return count;
  });

  ngOnInit(): void {
    this.loadServiceUsers();
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

          if (!this.activeFilterCount() || !this.filterSourceMovements().length) {
            this.filterSourceMovements.set(movements);
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
      type: '',
      origin: '',
      roomNumber: '',
      responsible: '',
      operationalResponsible: '',
      areaName: '',
      startDate: '',
      endDate: ''
    });
    this.advancedFiltersVisible.set(false);
    this.loadMovements();
  }

  protected toggleAdvancedFilters(): void {
    this.advancedFiltersVisible.update((value) => !value);
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
    return this.dateTimeFormatter.format(new Date(value));
  }

  protected formatMetric(value: number): string {
    return this.numberFormatter.format(value);
  }

  protected locationLabel(movement: InventoryMovement): string {
    return movement.roomNumber || movement.areaName || 'Sin ubicacion';
  }

  protected statusSeverity(movement: InventoryMovement): 'info' | 'danger' {
    return this.canVoid(movement) ? 'info' : 'danger';
  }

  protected filterOptionLabel(value: string): string {
    return this.formatLabel(value);
  }

  protected movementTypeLabel(movement: InventoryMovement): string {
    const normalizedOrigin = (movement.origin || '').toUpperCase();
    const normalizedType = (movement.movementType || '').toUpperCase();
    const normalizedReference = (movement.referenceText || '').toUpperCase();

    if (normalizedReference.includes('SERVICIO_HABITACION')) {
      return 'Salida';
    }

    if (
      normalizedReference.includes('HABITACION') &&
      !normalizedReference.includes('SERVICIO_HABITACION')
    ) {
      return 'Entrada';
    }

    if (normalizedOrigin.includes('HABITACION') || normalizedOrigin.includes('ROOM')) {
      return 'Entrada';
    }

    if (normalizedOrigin.includes('SERVICIO')) {
      return 'Salida';
    }

    if (
      normalizedType.includes('ENTRY') ||
      normalizedType.includes('ENTRADA') ||
      normalizedType.includes('RETURN') ||
      normalizedType.includes('DEVOL')
    ) {
      return 'Entrada';
    }

    return 'Salida';
  }

  protected itemMetaLabel(movement: InventoryMovement): string {
    const fragments = [this.filterOptionLabel(movement.origin)];
    fragments.push(`${this.formatMetric(movement.quantity)} uds`);
    fragments.push(`Stock final ${this.formatMetric(movement.stockAfter)}`);
    return fragments.join(' | ');
  }

  protected roomLabel(movement: InventoryMovement): string {
    return movement.roomNumber?.trim() || 'Sin habitacion';
  }

  protected areaLabel(movement: InventoryMovement): string {
    return movement.areaName?.trim() || 'Sin area';
  }

  protected responsibleLabel(movement: InventoryMovement): string {
    return movement.responsible?.trim() || 'Sin registro';
  }

  protected operationalResponsibleLabel(movement: InventoryMovement): string {
    return movement.operationalResponsible?.trim() || 'Sin asignar';
  }

  protected operationalHintLabel(movement: InventoryMovement): string {
    return movement.operationalResponsible?.trim()
      ? 'Seguimiento operativo'
      : 'Sin responsable operativo';
  }

  protected statusLabel(movement: InventoryMovement): string {
    return this.formatLabel(movement.status);
  }

  protected statusTone(movement: InventoryMovement): 'active' | 'danger' {
    return this.canVoid(movement) ? 'active' : 'danger';
  }

  protected serviceResponsibleLabel(movement: InventoryMovement): string {
    const serviceUsernames = new Set(this.serviceUsers().map((user) => user.username.toLowerCase()));

    if (
      movement.operationalResponsible?.trim() &&
      serviceUsernames.has(movement.operationalResponsible.toLowerCase())
    ) {
      return movement.operationalResponsible;
    }

    if (movement.responsible?.trim() && serviceUsernames.has(movement.responsible.toLowerCase())) {
      return movement.responsible;
    }

    if (movement.operationalResponsible?.trim()) {
      return movement.operationalResponsible;
    }

    if (movement.responsible?.trim()) {
      return movement.responsible;
    }

    return 'Sin responsable';
  }

  protected responsibleRoleLabel(movement: InventoryMovement): string {
    const serviceUsernames = new Set(this.serviceUsers().map((user) => user.username.toLowerCase()));
    const primaryResponsible = this.serviceResponsibleLabel(movement);

    if (primaryResponsible !== 'Sin responsable' && serviceUsernames.has(primaryResponsible.toLowerCase())) {
      return 'Servicio';
    }

    if (movement.responsible?.trim()) {
      return 'Registrado por ' + movement.responsible;
    }

    return 'Sin registro';
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

  private loadServiceUsers(): void {
    this.usersApi
      .getUsers()
      .pipe(take(1))
      .subscribe({
        next: (users) =>
          this.serviceUsers.set(
            users.filter((user) => user.active && user.roles.includes('SERVICIO'))
          ),
        error: () => {
          this.serviceUsers.set([]);
        }
      });
  }

  private optionSource(): InventoryMovement[] {
    return this.filterSourceMovements().length ? this.filterSourceMovements() : this.movements();
  }

  private buildOptions(values: Array<string | null | undefined>): SelectOption[] {
    return this.uniqueSorted(values).map((value) => ({
      value,
      label: this.formatLabel(value)
    }));
  }

  private uniqueSorted(values: Array<string | null | undefined>): string[] {
    const unique = new Map<string, string>();

    for (const value of values) {
      const trimmed = value?.trim();
      if (!trimmed) {
        continue;
      }

      const key = trimmed.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, trimmed);
      }
    }

    return Array.from(unique.values()).sort((left, right) =>
      left.localeCompare(right, 'es-CO', { numeric: true, sensitivity: 'base' })
    );
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
}
