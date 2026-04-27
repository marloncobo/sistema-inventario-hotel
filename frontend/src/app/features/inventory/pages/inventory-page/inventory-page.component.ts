import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { catchError, forkJoin, of, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { AuthService } from '@core/services/auth.service';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { RoomsApiService } from '@core/services/api/rooms-api.service';
import { UsersApiService } from '@core/services/api/users-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiErrorMessage, extractApiFieldErrors } from '@models/api-error.model';
import type { AppUser } from '@models/app-user.model';
import type {
  CatalogEntity,
  CreateSupplyItemRequest,
  InventoryMovement,
  Provider,
  StockEntryRequest,
  StockReturnRequest,
  SupplyItem,
  UnitOfMeasure,
  UpdateSupplyItemRequest
} from '@models/inventory.model';
import type { Room } from '@models/room.model';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { MinNumberDirective } from '@shared/directives/min-number.directive';
import { notBlankValidator } from '@shared/utils/app-validators.util';
import { applyServerValidationErrors } from '@shared/utils/form-errors.util';

type InventoryDialog = 'item' | 'entry' | 'return' | 'decrease';

type ItemFormStep = 1 | 2 | 3;

type ReturnSourceMovementOption = InventoryMovement & {
  pendingQuantity: number;
};

const ITEM_FORM_STEPS: ItemFormStep[] = [1, 2, 3];
const ITEM_FORM_STEP_TOTAL = 3;

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    DrawerModule,
    InputTextModule,
    EmptyStateComponent,
    TagModule,
    MinNumberDirective
  ],
  templateUrl: './inventory-page.component.html',
  styleUrls: ['./inventory-page.component.css', '../../../../shared/styles/premium-panels.css']
})
export class InventoryPageComponent implements OnInit {
  protected readonly itemFormSteps = ITEM_FORM_STEPS;
  protected readonly itemFormStepTotal = ITEM_FORM_STEP_TOTAL;
  protected readonly catalogPageSize = 12;

  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly items = signal<SupplyItem[]>([]);
  protected readonly selectedItem = signal<SupplyItem | null>(null);
  protected readonly categories = signal<CatalogEntity[]>([]);
  protected readonly units = signal<UnitOfMeasure[]>([]);
  protected readonly providers = signal<Provider[]>([]);
  protected readonly areas = signal<CatalogEntity[]>([]);
  protected readonly rooms = signal<Room[]>([]);
  protected readonly serviceUsers = signal<AppUser[]>([]);
  protected readonly returnSourceMovements = signal<ReturnSourceMovementOption[]>([]);
  protected readonly selectedReturnSourceMovementId = signal(0);
  protected readonly loading = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogSubmitError = signal<string | null>(null);
  protected readonly activeDialog = signal<InventoryDialog>('item');
  protected readonly editingItemId = signal<number | null>(null);
  protected readonly operationItemId = signal<number | null>(null);
  protected readonly itemFormStep = signal<ItemFormStep>(1);
  protected readonly catalogFirst = signal(0);
  protected dialogVisible = false;
  protected detailVisible = false;

  protected readonly filtersForm = this.fb.nonNullable.group({
    search: [''],
    category: ['']
  });

  protected readonly itemForm = this.fb.group({
    code: this.fb.nonNullable.control(''),
    name: this.fb.nonNullable.control('', [
      Validators.required,
      notBlankValidator,
      Validators.maxLength(180)
    ]),
    description: this.fb.control('', [Validators.maxLength(500)]),
    category: this.fb.nonNullable.control('', [Validators.required, notBlankValidator]),
    unit: this.fb.nonNullable.control('', [Validators.required, notBlankValidator]),
    providerName: this.fb.control('', [Validators.maxLength(180)]),
    stock: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    minStock: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    maxStock: this.fb.control<number | null>(null, [Validators.min(0)]),
    active: this.fb.nonNullable.control(true)
  });

  protected readonly entryForm = this.fb.group({
    quantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    providerName: this.fb.nonNullable.control('', [Validators.required, notBlankValidator]),
    referenceText: this.fb.control('', [Validators.maxLength(500)])
  });

  protected readonly returnForm = this.fb.group({
    quantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    roomNumber: this.fb.control('', [Validators.pattern(/^\d{3}$/)]),
    areaName: this.fb.control('', [Validators.maxLength(120)]),
    operationalResponsible: this.fb.control('', [Validators.maxLength(120)]),
    referenceText: this.fb.control('', [Validators.maxLength(500)]),
    sourceMovementId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)])
  });

  protected readonly decreaseForm = this.fb.group({
    quantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    roomNumber: this.fb.control('', [Validators.pattern(/^\d{3}$/)]),
    areaName: this.fb.control('', [Validators.maxLength(120)]),
    origin: this.fb.nonNullable.control('CONSUMO_INTERNO', [Validators.required, notBlankValidator]),
    operationalResponsible: this.fb.control('', [Validators.maxLength(120)]),
    referenceText: this.fb.control('', [Validators.maxLength(500)])
  });

  protected readonly filteredItems = computed(() => {
    const search = this.filtersForm.controls.search.getRawValue().trim().toLowerCase();
    const category = this.filtersForm.controls.category.getRawValue().trim().toLowerCase();

    return this.items().filter((item) => {
      const matchesSearch =
        !search ||
        item.code.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        (item.providerName ?? '').toLowerCase().includes(search);

      const matchesCategory = !category || (item.category ?? '').toLowerCase().includes(category);

      return matchesSearch && matchesCategory;
    });
  });

  protected readonly orderedItems = computed(() =>
    [...this.filteredItems()].sort((left, right) => this.compareItems(left, right))
  );

  protected readonly catalogPagedItems = computed(() => {
    const list = this.orderedItems();
    const first = this.catalogFirst();
    return list.slice(first, first + this.catalogPageSize);
  });

  protected readonly activeItemsCount = computed(
    () => this.orderedItems().filter((item) => item.active).length
  );

  protected readonly lowStockCount = computed(
    () => this.orderedItems().filter((item) => item.stock > 0 && this.isLowStock(item)).length
  );

  protected readonly outOfStockCount = computed(
    () => this.orderedItems().filter((item) => item.stock === 0).length
  );

  protected readonly categoryOptions = computed(() => {
    const values = new Set<string>();
    this.categories().forEach((entry) => values.add(entry.code));
    this.items().forEach((entry) => entry.category && values.add(entry.category));
    return Array.from(values).sort();
  });

  protected readonly unitOptions = computed(() => {
    const values = new Set<string>();
    this.units().forEach((entry) => entry.abbreviation && values.add(entry.abbreviation));
    this.items().forEach((entry) => entry.unit && values.add(entry.unit));
    return Array.from(values).sort();
  });

  protected readonly providerOptions = computed(() => {
    const values = new Set<string>();
    this.providers().forEach((entry) => values.add(entry.name));
    this.items().forEach((entry) => entry.providerName && values.add(entry.providerName));
    return Array.from(values).sort();
  });

  protected readonly serviceUserOptions = computed(() =>
    this.serviceUsers().map((user) => user.username)
  );

  protected readonly roomOptions = computed(() => {
    const values = new Set<string>();
    this.rooms().forEach((room) => room.number && values.add(room.number));
    this.returnSourceMovements().forEach((movement) => movement.roomNumber && values.add(movement.roomNumber));
    return this.sortOptions(Array.from(values));
  });

  protected readonly areaOptions = computed(() => {
    const values = new Set<string>();
    this.areas().forEach((area) => area.name && values.add(area.name));
    this.returnSourceMovements().forEach((movement) => movement.areaName && values.add(movement.areaName));
    return this.sortOptions(Array.from(values));
  });

  protected readonly selectedReturnSourceMovement = computed(() =>
    this.returnSourceMovements().find(
      (movement) => movement.id === this.selectedReturnSourceMovementId()
    ) ?? null
  );

  constructor() {
    effect(() => {
      const total = this.orderedItems().length;
      const first = this.catalogFirst();

      if (total === 0) {
        if (first !== 0) {
          this.catalogFirst.set(0);
        }
        return;
      }

      if (first >= total) {
        const page = Math.floor((total - 1) / this.catalogPageSize);
        this.catalogFirst.set(page * this.catalogPageSize);
      }
    });
  }

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadItems();

    this.filtersForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.catalogFirst.set(0);
    });

    this.returnForm.controls.sourceMovementId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((sourceMovementId) => {
        this.selectedReturnSourceMovementId.set(sourceMovementId);
        this.syncReturnContext(sourceMovementId);
      });
  }

  protected isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  protected canManageItems(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA']);
  }

  protected canDeactivateItem(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  protected canRegisterEntry(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA']);
  }

  protected canRegisterDecrease(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'SERVICIO']);
  }

  protected canReturnStock(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'SERVICIO']);
  }

  protected isLowStock(item: SupplyItem): boolean {
    return item.stock <= item.minStock;
  }

  protected itemCategoryLabel(item: SupplyItem): string {
    return item.category?.trim() || 'Sin categoria';
  }

  protected itemProviderLabel(item: SupplyItem): string {
    return item.providerName?.trim() || 'Sin proveedor';
  }

  protected itemUnitLabel(item: SupplyItem): string {
    return item.unit?.trim() || '--';
  }

  protected itemDescriptionLabel(item: SupplyItem): string {
    const text = item.description?.trim();
    return text ? text : 'Sin descripcion registrada.';
  }

  protected itemStockStatusLabel(item: SupplyItem): string {
    if (!item.active) {
      return 'Inactivo';
    }

    if (item.stock === 0) {
      return 'Agotado';
    }

    if (this.isLowStock(item)) {
      return 'Stock bajo';
    }

    return 'Stock estable';
  }

  protected itemStockStatusSeverity(item: SupplyItem): 'success' | 'warn' | 'danger' {
    if (!item.active || item.stock === 0) {
      return 'danger';
    }

    if (this.isLowStock(item)) {
      return 'warn';
    }

    return 'success';
  }

  protected itemStatusTone(item: SupplyItem): 'success' | 'warn' | 'danger' {
    if (item.stock === 0) {
      return 'danger';
    }

    if (!item.active || this.isLowStock(item)) {
      return 'warn';
    }

    return 'success';
  }

  protected maxStockLabel(item: SupplyItem): string {
    return item.maxStock === null ? '--' : `${item.maxStock}`;
  }

  protected calculateStockPercentage(item: SupplyItem): number {
    if (!item.maxStock || item.maxStock === 0) {
      return item.stock > 0 ? 100 : 0;
    }

    const percentage = (item.stock / item.maxStock) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  }

  protected availabilityPercent(item: SupplyItem): number {
    return Math.round(this.calculateStockPercentage(item));
  }

  protected itemInitials(item: SupplyItem): string {
    const name = item.name?.trim();
    if (!name) {
      return '?';
    }

    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
  }

  protected dialogTitle(): string {
    switch (this.activeDialog()) {
      case 'entry':
        return 'Registrar entrada de stock';
      case 'return':
        return 'Registrar devolucion';
      case 'decrease':
        return 'Salida interna';
      default:
        return this.editingItemId() === null ? 'Crear insumo' : 'Editar insumo';
    }
  }

  protected itemDrawerTitle(): string {
    return this.editingItemId() === null ? 'Nuevo insumo' : 'Editar insumo';
  }

  protected operationDialogTitle(): string {
    return this.dialogTitle();
  }

  protected itemFormStepTitle(step: ItemFormStep): string {
    switch (step) {
      case 1:
        return 'Identificacion';
      case 2:
        return 'Stock y limites';
      default:
        return 'Proveedor y notas';
    }
  }

  protected itemFormProgressPercent(): number {
    return (this.itemFormStep() / ITEM_FORM_STEP_TOTAL) * 100;
  }

  protected catalogRangeLabel(): string {
    const total = this.orderedItems().length;
    if (total === 0) {
      return '0 resultados';
    }

    const first = this.catalogFirst();
    const last = Math.min(first + this.catalogPageSize, total);
    return `${first + 1}-${last} de ${total}`;
  }

  protected catalogSummaryLabel(): string {
    const total = this.orderedItems().length;
    if (total === 0) {
      return 'Mostrando 0 a 0 de 0 insumos';
    }

    const first = this.catalogFirst() + 1;
    const last = this.catalogFirst() + this.catalogPagedItems().length;
    return `Mostrando ${first} a ${last} de ${total} insumos`;
  }

  protected catalogCurrentPageLabel(): string {
    return `${Math.floor(this.catalogFirst() / this.catalogPageSize) + 1}`;
  }

  protected catalogCanPrev(): boolean {
    return this.catalogFirst() > 0;
  }

  protected catalogCanNext(): boolean {
    return this.catalogFirst() + this.catalogPageSize < this.orderedItems().length;
  }

  protected catalogPrev(): void {
    this.catalogFirst.update((first) => Math.max(0, first - this.catalogPageSize));
  }

  protected catalogNext(): void {
    this.catalogFirst.update((first) => first + this.catalogPageSize);
  }

  protected nextItemFormStep(): void {
    const step = this.itemFormStep();

    if (step === 1) {
      this.touchItemStep1();
      if (
        this.itemForm.controls.name.invalid ||
        this.itemForm.controls.category.invalid ||
        this.itemForm.controls.unit.invalid
      ) {
        return;
      }
      this.itemFormStep.set(2);
      return;
    }

    if (step === 2) {
      this.touchItemStep2();
      if (
        this.itemForm.controls.minStock.invalid ||
        this.itemForm.controls.maxStock.invalid ||
        (this.editingItemId() === null && this.itemForm.controls.stock.invalid)
      ) {
        return;
      }
      this.itemFormStep.set(3);
    }
  }

  protected prevItemFormStep(): void {
    const step = this.itemFormStep();
    if (step > 1) {
      this.itemFormStep.set((step - 1) as ItemFormStep);
    }
  }

  protected goItemFormStep(target: ItemFormStep): void {
    const current = this.itemFormStep();
    if (target >= current) {
      return;
    }

    this.itemFormStep.set(target);
  }

  private touchItemStep1(): void {
    this.itemForm.controls.name.markAsTouched();
    this.itemForm.controls.category.markAsTouched();
    this.itemForm.controls.unit.markAsTouched();
  }

  private touchItemStep2(): void {
    this.itemForm.controls.minStock.markAsTouched();
    this.itemForm.controls.maxStock.markAsTouched();
    if (this.editingItemId() === null) {
      this.itemForm.controls.stock.markAsTouched();
    }
  }

  protected loadItems(): void {
    this.loading.set(true);
    const category = this.filtersForm.controls.category.getRawValue().trim();
    const filter = this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA']) ? category : null;

    this.inventoryApi
      .getItems(filter)
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.catalogFirst.set(0);

          const currentSelectedItemId = this.selectedItem()?.id;
          if (currentSelectedItemId) {
            const currentItem = items.find((item) => item.id === currentSelectedItemId) ?? null;
            this.selectedItem.set(currentItem);
            if (!currentItem && items.length) {
              this.selectItem(items[0].id);
            } else if (!currentItem) {
              this.detailVisible = false;
            } else if (this.detailVisible) {
              this.selectItem(currentSelectedItemId);
            }
          } else if (items.length) {
            this.selectItem(items[0].id);
          } else {
            this.selectedItem.set(null);
            this.detailVisible = false;
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
      category: ''
    });
    this.loadItems();
  }

  protected openItemDetail(id: number): void {
    this.detailVisible = true;
    this.selectItem(id);
  }

  protected selectItem(id: number): void {
    this.detailLoading.set(true);

    this.inventoryApi
      .getItem(id)
      .pipe(take(1))
      .subscribe({
        next: (item) => {
          this.selectedItem.set(item);
          this.detailLoading.set(false);
        },
        error: () => {
          this.detailLoading.set(false);
        }
      });
  }

  protected openItemDialog(item?: SupplyItem): void {
    this.dialogSubmitError.set(null);
    this.activeDialog.set('item');
    this.itemFormStep.set(1);
    this.editingItemId.set(item?.id ?? null);
    this.operationItemId.set(item?.id ?? null);
    this.itemForm.reset({
      code: item?.code ?? '',
      name: item?.name ?? '',
      description: item?.description ?? '',
      category: item?.category ?? '',
      unit: item?.unit ?? '',
      providerName: item?.providerName ?? '',
      stock: item?.stock ?? 0,
      minStock: item?.minStock ?? 0,
      maxStock: item?.maxStock ?? null,
      active: item?.active ?? true
    });
    this.dialogVisible = true;
  }

  protected openEntryDialog(item: SupplyItem): void {
    this.dialogSubmitError.set(null);
    this.activeDialog.set('entry');
    this.operationItemId.set(item.id);
    this.entryForm.reset({
      quantity: 1,
      providerName: item.providerName ?? '',
      referenceText: ''
    });
    this.dialogVisible = true;
  }

  protected openReturnDialog(item: SupplyItem): void {
    this.dialogSubmitError.set(null);
    this.activeDialog.set('return');
    this.operationItemId.set(item.id);
    this.loadReturnSourceMovements(item.id);
    this.selectedReturnSourceMovementId.set(0);
    this.returnForm.reset({
      quantity: 1,
      roomNumber: '',
      areaName: '',
      operationalResponsible: '',
      referenceText: '',
      sourceMovementId: 0
    });
    this.dialogVisible = true;
  }

  protected openDecreaseDialog(item: SupplyItem): void {
    this.dialogSubmitError.set(null);
    this.activeDialog.set('decrease');
    this.operationItemId.set(item.id);
    this.loadReturnSourceMovements(item.id);
    this.decreaseForm.reset({
      quantity: 1,
      roomNumber: '',
      areaName: '',
      origin: 'CONSUMO_INTERNO',
      operationalResponsible: '',
      referenceText: ''
    });
    this.dialogVisible = true;
  }

  protected deactivate(item: SupplyItem): void {
    this.inventoryApi
      .deactivateItem(item.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.notificationService.success('Inventario', 'Insumo desactivado.');
          this.loadItems();
          if (this.selectedItem()?.id === item.id) {
            this.detailVisible = true;
            this.selectItem(item.id);
          }
        },
        error: () => {
          this.notificationService.error('Inventario', 'No se pudo desactivar el insumo.');
        }
      });
  }

  protected activate(item: SupplyItem): void {
    if (!item.category?.trim() || !item.unit?.trim()) {
      this.notificationService.warn(
        'Inventario',
        'Completa categoria y unidad del insumo antes de activarlo.'
      );
      this.openItemDialog(item);
      return;
    }

    const payload: UpdateSupplyItemRequest = {
      code: item.code.trim(),
      name: item.name.trim(),
      description: item.description?.trim() || null,
      category: item.category.trim(),
      unit: item.unit.trim(),
      providerName: item.providerName?.trim() || null,
      minStock: item.minStock,
      maxStock: item.maxStock ?? null,
      active: true
    };

    this.inventoryApi
      .updateItem(item.id, payload)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.notificationService.success('Inventario', 'Insumo activado.');
          this.loadItems();
          if (this.selectedItem()?.id === item.id) {
            this.detailVisible = true;
            this.selectItem(item.id);
          }
        },
        error: () => {
          this.notificationService.error('Inventario', 'No se pudo activar el insumo.');
        }
      });
  }

  protected onItemFormSubmit(): void {
    if (this.itemFormStep() < ITEM_FORM_STEP_TOTAL) {
      this.nextItemFormStep();
      return;
    }

    this.submitItem();
  }

  protected submitItem(): void {
    this.dialogSubmitError.set(null);
    this.clearCustomItemErrors();

    const raw = this.itemForm.getRawValue();
    if (raw.maxStock !== null && raw.maxStock < raw.minStock) {
      this.itemForm.controls.maxStock.setErrors({
        ...(this.itemForm.controls.maxStock.errors ?? {}),
        maxBelowMin: true
      });
      this.itemForm.controls.maxStock.markAsTouched();
    }

    if (
      this.editingItemId() === null &&
      raw.maxStock !== null &&
      raw.stock > raw.maxStock
    ) {
      this.itemForm.controls.stock.setErrors({
        ...(this.itemForm.controls.stock.errors ?? {}),
        stockAboveMax: true
      });
      this.itemForm.controls.stock.markAsTouched();
    }

    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    const basePayload = {
      name: raw.name.trim(),
      description: raw.description?.trim() || null,
      category: raw.category.trim(),
      unit: raw.unit.trim(),
      providerName: raw.providerName?.trim() || null,
      minStock: raw.minStock,
      maxStock: raw.maxStock ?? null,
      active: raw.active
    };

    this.saving.set(true);

    const request$ =
      this.editingItemId() === null
        ? this.inventoryApi.createItem({
            ...basePayload,
            stock: raw.stock
          } as CreateSupplyItemRequest)
        : this.inventoryApi.updateItem(
            this.editingItemId()!,
            {
              code: raw.code.trim(),
              ...basePayload
            } as UpdateSupplyItemRequest
          );

    request$.pipe(take(1)).subscribe({
      next: (item) => {
        this.saving.set(false);
        this.dialogVisible = false;
        this.resetDialogs();
        this.notificationService.success('Inventario', 'Insumo guardado correctamente.');
        this.loadItems();
        this.selectedItem.set(item);
        this.detailVisible = true;
        this.selectItem(item.id);
      },
      error: (error) => {
        this.saving.set(false);
        const fieldErrors = extractApiFieldErrors(error.error);
        if (Object.keys(fieldErrors).length) {
          applyServerValidationErrors(this.itemForm, fieldErrors);
          this.dialogSubmitError.set('Revisa los campos marcados antes de guardar.');
          return;
        }

        this.dialogSubmitError.set(extractApiErrorMessage(error.error));
      }
    });
  }

  protected submitEntry(): void {
    this.dialogSubmitError.set(null);
    if (this.entryForm.invalid || this.operationItemId() === null) {
      this.entryForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.entryForm.getRawValue();
    const payload: StockEntryRequest = {
      quantity: raw.quantity,
      providerName: raw.providerName.trim(),
      referenceText: raw.referenceText?.trim() || null
    };

    this.inventoryApi
      .addStockEntry(this.operationItemId()!, payload)
      .pipe(take(1))
      .subscribe({
        next: (item) => {
          this.saving.set(false);
          this.dialogVisible = false;
          this.resetDialogs();
          this.notificationService.success('Inventario', 'Entrada registrada.');
          this.loadItems();
          this.selectedItem.set(item);
          this.detailVisible = true;
          this.selectItem(item.id);
        },
        error: (error) => {
          this.saving.set(false);
          const fieldErrors = extractApiFieldErrors(error.error);
          if (Object.keys(fieldErrors).length) {
            applyServerValidationErrors(this.entryForm, fieldErrors);
            this.dialogSubmitError.set('Revisa los campos marcados antes de registrar la entrada.');
            return;
          }

          this.dialogSubmitError.set(extractApiErrorMessage(error.error));
        }
      });
  }

  protected submitReturn(): void {
    this.dialogSubmitError.set(null);
    const currentItemId = this.operationItemId();
    if (this.returnForm.invalid || currentItemId === null) {
      this.returnForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.returnForm.getRawValue();
    const payload: StockReturnRequest = {
      quantity: raw.quantity,
      roomNumber: raw.roomNumber?.trim() || null,
      areaName: raw.areaName?.trim() || null,
      operationalResponsible: raw.operationalResponsible?.trim() || null,
      referenceText: raw.referenceText?.trim() || null,
      sourceMovementId: raw.sourceMovementId
    };

    this.inventoryApi
      .returnStock(currentItemId, payload)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          this.dialogVisible = false;
          this.resetDialogs();
          this.notificationService.success(
            'Inventario',
            response.message || 'Devolucion registrada.'
          );
          this.loadItems();
          this.detailVisible = true;
          this.selectItem(currentItemId);
        },
        error: (error) => {
          this.saving.set(false);
          const fieldErrors = extractApiFieldErrors(error.error);
          if (Object.keys(fieldErrors).length) {
            applyServerValidationErrors(this.returnForm, fieldErrors);
            this.dialogSubmitError.set('Revisa los campos marcados antes de confirmar la devolucion.');
            return;
          }

          this.dialogSubmitError.set(extractApiErrorMessage(error.error));
        }
      });
  }

  protected submitDecrease(): void {
    this.dialogSubmitError.set(null);
    const currentItemId = this.operationItemId();
    if (this.decreaseForm.invalid || currentItemId === null) {
      this.decreaseForm.markAllAsTouched();
      return;
    }

    const origin = this.decreaseForm.controls.origin.getRawValue().trim().toUpperCase();
    if (origin === 'HABITACION') {
      this.decreaseForm.controls.origin.setErrors({
        server: 'Debes usar el modulo de asignaciones para habitaciones.'
      });
      this.decreaseForm.controls.origin.markAsTouched();
      this.dialogSubmitError.set('Debes usar el modulo de asignaciones para habitaciones.');
      return;
    }

    this.saving.set(true);
    const raw = this.decreaseForm.getRawValue();

    this.inventoryApi
      .decreaseInternalStock({
        itemId: currentItemId,
        quantity: raw.quantity,
        roomNumber: raw.roomNumber?.trim() || null,
        areaName: raw.areaName?.trim() || null,
        origin,
        operationalResponsible: raw.operationalResponsible?.trim() || null,
        referenceText: raw.referenceText?.trim() || null
      })
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          this.dialogVisible = false;
          this.resetDialogs();
          this.notificationService.success('Inventario', response.message || 'Salida registrada.');
          this.loadItems();
          this.detailVisible = true;
          this.selectItem(currentItemId);
        },
        error: (error) => {
          this.saving.set(false);
          const fieldErrors = extractApiFieldErrors(error.error);
          if (Object.keys(fieldErrors).length) {
            applyServerValidationErrors(this.decreaseForm, fieldErrors);
            this.dialogSubmitError.set('Revisa los campos marcados antes de registrar la salida.');
            return;
          }

          this.dialogSubmitError.set(extractApiErrorMessage(error.error));
        }
      });
  }

  protected resetDialogs(): void {
    this.dialogSubmitError.set(null);
    this.editingItemId.set(null);
    this.operationItemId.set(null);
    this.itemFormStep.set(1);

    this.itemForm.reset({
      code: '',
      name: '',
      description: '',
      category: '',
      unit: '',
      providerName: '',
      stock: 0,
      minStock: 0,
      maxStock: null,
      active: true
    });

    this.entryForm.reset({
      quantity: 1,
      providerName: '',
      referenceText: ''
    });

    this.returnForm.reset({
      quantity: 1,
      roomNumber: '',
      areaName: '',
      operationalResponsible: '',
      referenceText: '',
      sourceMovementId: 0
    });

    this.decreaseForm.reset({
      quantity: 1,
      roomNumber: '',
      areaName: '',
      origin: 'CONSUMO_INTERNO',
      operationalResponsible: '',
      referenceText: ''
    });

    this.returnSourceMovements.set([]);
    this.selectedReturnSourceMovementId.set(0);
  }

  protected showItemError(
    controlName:
      | 'name'
      | 'category'
      | 'unit'
      | 'stock'
      | 'minStock'
      | 'maxStock'
      | 'providerName'
      | 'description'
  ): boolean {
    const control = this.itemForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected itemError(
    controlName:
      | 'name'
      | 'category'
      | 'unit'
      | 'stock'
      | 'minStock'
      | 'maxStock'
      | 'providerName'
      | 'description'
  ): string {
    return this.resolveControlError(this.itemForm.controls[controlName].errors);
  }

  protected showEntryError(controlName: 'quantity' | 'providerName' | 'referenceText'): boolean {
    const control = this.entryForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected entryError(controlName: 'quantity' | 'providerName' | 'referenceText'): string {
    return this.resolveControlError(this.entryForm.controls[controlName].errors);
  }

  protected showReturnError(
    controlName:
      | 'quantity'
      | 'sourceMovementId'
      | 'roomNumber'
      | 'areaName'
      | 'operationalResponsible'
      | 'referenceText'
  ): boolean {
    const control = this.returnForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected returnError(
    controlName:
      | 'quantity'
      | 'sourceMovementId'
      | 'roomNumber'
      | 'areaName'
      | 'operationalResponsible'
      | 'referenceText'
  ): string {
    return this.resolveControlError(this.returnForm.controls[controlName].errors);
  }

  protected showDecreaseError(
    controlName:
      | 'quantity'
      | 'origin'
      | 'roomNumber'
      | 'areaName'
      | 'operationalResponsible'
      | 'referenceText'
  ): boolean {
    const control = this.decreaseForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected decreaseError(
    controlName:
      | 'quantity'
      | 'origin'
      | 'roomNumber'
      | 'areaName'
      | 'operationalResponsible'
      | 'referenceText'
  ): string {
    return this.resolveControlError(this.decreaseForm.controls[controlName].errors);
  }

  private clearCustomItemErrors(): void {
    this.clearControlError(this.itemForm.controls.stock, 'stockAboveMax');
    this.clearControlError(this.itemForm.controls.maxStock, 'maxBelowMin');
  }

  private loadReferenceData(): void {
    if (this.isAdmin()) {
      forkJoin({
        categories: this.inventoryApi
          .getCategories()
          .pipe(catchError(() => of([] as CatalogEntity[]))),
        units: this.inventoryApi.getUnits().pipe(catchError(() => of([] as UnitOfMeasure[]))),
        providers: this.inventoryApi
          .getProviders()
          .pipe(catchError(() => of([] as Provider[]))),
        areas: this.inventoryApi.getAreas().pipe(catchError(() => of([] as CatalogEntity[]))),
        rooms: this.roomsApi.getRooms().pipe(catchError(() => of([] as Room[]))),
        users: this.usersApi.getUsers().pipe(catchError(() => of([] as AppUser[])))
      })
        .pipe(take(1))
        .subscribe((result) => {
          this.categories.set(result.categories);
          this.units.set(result.units);
          this.providers.set(result.providers);
          this.areas.set(result.areas);
          this.rooms.set(result.rooms);
          this.serviceUsers.set(
            result.users.filter((user) => user.active && user.roles.includes('SERVICIO'))
          );
        });
      return;
    }

    if (this.canManageItems()) {
      forkJoin({
        providers: this.inventoryApi
          .getProviders()
          .pipe(catchError(() => of([] as Provider[]))),
        areas: this.inventoryApi.getAreas().pipe(catchError(() => of([] as CatalogEntity[]))),
        rooms: this.roomsApi.getRooms().pipe(catchError(() => of([] as Room[]))),
        users: this.usersApi.getUsers().pipe(catchError(() => of([] as AppUser[])))
      })
        .pipe(take(1))
        .subscribe((result) => {
          this.providers.set(result.providers);
          this.areas.set(result.areas);
          this.rooms.set(result.rooms);
          this.serviceUsers.set(
            result.users.filter((user) => user.active && user.roles.includes('SERVICIO'))
          );
        });
      return;
    }

    forkJoin({
      areas: this.inventoryApi.getAreas().pipe(catchError(() => of([] as CatalogEntity[]))),
      rooms: this.roomsApi.getRooms().pipe(catchError(() => of([] as Room[]))),
      users: this.usersApi.getUsers().pipe(catchError(() => of([] as AppUser[])))
    })
      .pipe(take(1))
      .subscribe((result) => {
        this.areas.set(result.areas);
        this.rooms.set(result.rooms);
        this.serviceUsers.set(
          result.users.filter((user) => user.active && user.roles.includes('SERVICIO'))
        );
      });
  }

  private loadReturnSourceMovements(itemId: number): void {
    this.returnSourceMovements.set([]);
    this.selectedReturnSourceMovementId.set(0);

    this.inventoryApi
      .getMovements({})
      .pipe(take(1))
      .subscribe({
        next: (movements) => {
          const returnedQuantities = new Map<number, number>();

          movements.forEach((movement) => {
            if (
              movement.sourceMovementId &&
              movement.movementType.toUpperCase() === 'DEVOLUCION' &&
              movement.status.toUpperCase() === 'VALIDO'
            ) {
              returnedQuantities.set(
                movement.sourceMovementId,
                (returnedQuantities.get(movement.sourceMovementId) ?? 0) + movement.quantity
              );
            }
          });

          this.returnSourceMovements.set(
            movements
              .filter((movement) => this.isValidReturnSourceMovement(movement, itemId))
              .map((movement) => ({
                ...movement,
                pendingQuantity: Math.max(
                  movement.quantity - (returnedQuantities.get(movement.id) ?? 0),
                  0
                )
              }))
              .filter((movement) => movement.pendingQuantity > 0)
              .sort(
                (left, right) =>
                  new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
              )
          );
        },
        error: () => {
          this.returnSourceMovements.set([]);
        }
      });
  }

  protected returnSourceMovementLabel(movement: ReturnSourceMovementOption): string {
    const location = movement.roomNumber?.trim() || movement.areaName?.trim() || 'Sin ubicacion';
    return `#${movement.id} | ${this.formatMovementOrigin(movement.origin)} | ${location} | Pendiente ${movement.pendingQuantity}`;
  }

  private isValidReturnSourceMovement(movement: InventoryMovement, itemId: number): boolean {
    if (movement.itemId !== itemId) {
      return false;
    }

    if (['ANULADO', 'VOIDED', 'VOID'].includes((movement.status || '').toUpperCase())) {
      return false;
    }

    if (movement.sourceMovementId) {
      return false;
    }

    return movement.movementType.toUpperCase() === 'SALIDA';
  }

  private syncReturnContext(sourceMovementId: number): void {
    const sourceMovement =
      this.returnSourceMovements().find((movement) => movement.id === sourceMovementId) ?? null;

    this.returnForm.patchValue(
      {
        roomNumber: sourceMovement?.roomNumber ?? '',
        areaName: sourceMovement?.areaName ?? ''
      },
      { emitEvent: false }
    );
  }

  private formatMovementOrigin(value: string | null | undefined): string {
    if (!value) {
      return 'Sin origen';
    }

    return value
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private sortOptions(values: string[]): string[] {
    return values.sort((left, right) =>
      left.localeCompare(right, 'es-CO', { numeric: true, sensitivity: 'base' })
    );
  }

  private clearControlError(control: { errors: ValidationErrors | null; setErrors: (errors: ValidationErrors | null) => void }, key: string): void {
    if (!control.errors?.[key]) {
      return;
    }

    const { [key]: _removed, ...rest } = control.errors;
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

    if (errors['blank']) {
      return 'No puede quedar en blanco.';
    }

    if (errors['min']) {
      return 'Debe ser mayor o igual al minimo permitido.';
    }

    if (errors['pattern']) {
      return 'Debe tener exactamente 3 digitos.';
    }

    if (errors['maxlength']) {
      return `No puede superar ${errors['maxlength'].requiredLength} caracteres.`;
    }

    if (errors['maxBelowMin']) {
      return 'El stock maximo debe ser mayor o igual al stock minimo.';
    }

    if (errors['stockAboveMax']) {
      return 'El stock inicial no puede superar el stock maximo configurado.';
    }

    return 'Valor invalido.';
  }

  private compareItems(left: SupplyItem, right: SupplyItem): number {
    const categoryDifference = this.itemCategoryLabel(left).localeCompare(
      this.itemCategoryLabel(right),
      undefined,
      { sensitivity: 'base' }
    );

    if (categoryDifference !== 0) {
      return categoryDifference;
    }

    const stockPriorityDifference = this.stockPriority(left) - this.stockPriority(right);
    if (stockPriorityDifference !== 0) {
      return stockPriorityDifference;
    }

    return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
  }

  private stockPriority(item: SupplyItem): number {
    if (!item.active) {
      return 3;
    }

    if (item.stock === 0) {
      return 0;
    }

    if (this.isLowStock(item)) {
      return 1;
    }

    return 2;
  }
}
