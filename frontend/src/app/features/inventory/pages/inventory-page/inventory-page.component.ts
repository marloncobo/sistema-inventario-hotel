import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { catchError, forkJoin, of, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuthService } from '@core/services/auth.service';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiFieldErrors } from '@models/api-error.model';
import type {
  CatalogEntity,
  CreateSupplyItemRequest,
  Provider,
  StockEntryRequest,
  StockReturnRequest,
  SupplyItem,
  UnitOfMeasure,
  UpdateSupplyItemRequest
} from '@models/inventory.model';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { applyServerValidationErrors } from '@shared/utils/form-errors.util';

type InventoryDialog = 'item' | 'entry' | 'return' | 'decrease';

@Component({
  selector: 'app-inventory-page',
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
  templateUrl: './inventory-page.component.html'
})
export class InventoryPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly items = signal<SupplyItem[]>([]);
  protected readonly selectedItem = signal<SupplyItem | null>(null);
  protected readonly categories = signal<CatalogEntity[]>([]);
  protected readonly units = signal<UnitOfMeasure[]>([]);
  protected readonly providers = signal<Provider[]>([]);
  protected readonly loading = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly activeDialog = signal<InventoryDialog>('item');
  protected readonly editingItemId = signal<number | null>(null);
  protected readonly operationItemId = signal<number | null>(null);
  protected dialogVisible = false;

  protected readonly filtersForm = this.fb.nonNullable.group({
    search: [''],
    category: ['']
  });

  protected readonly itemForm = this.fb.group({
    code: this.fb.nonNullable.control('', [Validators.required]),
    name: this.fb.nonNullable.control('', [Validators.required]),
    description: this.fb.control(''),
    category: this.fb.nonNullable.control('', [Validators.required]),
    unit: this.fb.nonNullable.control('', [Validators.required]),
    providerName: this.fb.control(''),
    stock: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    minStock: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    maxStock: this.fb.control<number | null>(null, [Validators.min(0)]),
    active: this.fb.nonNullable.control(true)
  });

  protected readonly entryForm = this.fb.group({
    quantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    providerName: this.fb.nonNullable.control('', [Validators.required]),
    referenceText: this.fb.control('')
  });

  protected readonly returnForm = this.fb.group({
    quantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    roomNumber: this.fb.control(''),
    areaName: this.fb.control(''),
    operationalResponsible: this.fb.control(''),
    referenceText: this.fb.control(''),
    sourceMovementId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)])
  });

  protected readonly decreaseForm = this.fb.group({
    quantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    roomNumber: this.fb.control(''),
    areaName: this.fb.control(''),
    origin: this.fb.nonNullable.control('', [Validators.required]),
    operationalResponsible: this.fb.control(''),
    referenceText: this.fb.control('')
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

      const matchesCategory =
        !category || (item.category ?? '').toLowerCase().includes(category);

      return matchesSearch && matchesCategory;
    });
  });

  protected readonly activeItemsCount = computed(
    () => this.filteredItems().filter((item) => item.active).length
  );

  protected readonly lowStockCount = computed(
    () => this.filteredItems().filter((item) => this.isLowStock(item)).length
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

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadItems();
  }

  protected isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  protected canManageItems(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA']);
  }

  protected canReturnStock(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA', 'SERVICIO']);
  }

  protected isLowStock(item: SupplyItem): boolean {
    return item.stock <= item.minStock;
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
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
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
    this.activeDialog.set('item');
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
    this.activeDialog.set('return');
    this.operationItemId.set(item.id);
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
    this.activeDialog.set('decrease');
    this.operationItemId.set(item.id);
    this.decreaseForm.reset({
      quantity: 1,
      roomNumber: '',
      areaName: '',
      origin: '',
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
            this.selectItem(item.id);
          }
        }
      });
  }

  protected submitItem(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const raw = this.itemForm.getRawValue();
    const basePayload = {
      code: raw.code.trim(),
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
            basePayload as UpdateSupplyItemRequest
          );

    request$.pipe(take(1)).subscribe({
      next: (item) => {
        this.saving.set(false);
        this.dialogVisible = false;
        this.resetDialogs();
        this.notificationService.success('Inventario', 'Insumo guardado correctamente.');
        this.loadItems();
        this.selectedItem.set(item);
      },
      error: (error) => {
        this.saving.set(false);
        applyServerValidationErrors(this.itemForm, extractApiFieldErrors(error.error));
      }
    });
  }

  protected submitEntry(): void {
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
        },
        error: (error) => {
          this.saving.set(false);
          applyServerValidationErrors(this.entryForm, extractApiFieldErrors(error.error));
        }
      });
  }

  protected submitReturn(): void {
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
          this.notificationService.success('Inventario', response.message || 'Devolucion registrada.');
          this.loadItems();
          this.selectItem(currentItemId);
        },
        error: (error) => {
          this.saving.set(false);
          applyServerValidationErrors(this.returnForm, extractApiFieldErrors(error.error));
        }
      });
  }

  protected submitDecrease(): void {
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
          this.selectItem(currentItemId);
        },
        error: (error) => {
          this.saving.set(false);
          applyServerValidationErrors(this.decreaseForm, extractApiFieldErrors(error.error));
        }
      });
  }

  protected resetDialogs(): void {
    this.editingItemId.set(null);
    this.operationItemId.set(null);
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
      origin: '',
      operationalResponsible: '',
      referenceText: ''
    });
  }

  protected showItemError(
    controlName: 'code' | 'name' | 'category' | 'unit' | 'stock' | 'minStock'
  ): boolean {
    const control = this.itemForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected itemError(
    controlName: 'code' | 'name' | 'category' | 'unit' | 'stock' | 'minStock'
  ): string {
    return this.resolveControlError(this.itemForm.controls[controlName].errors);
  }

  protected showEntryError(controlName: 'quantity' | 'providerName'): boolean {
    const control = this.entryForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected entryError(controlName: 'quantity' | 'providerName'): string {
    return this.resolveControlError(this.entryForm.controls[controlName].errors);
  }

  protected showReturnError(controlName: 'quantity' | 'sourceMovementId'): boolean {
    const control = this.returnForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected returnError(controlName: 'quantity' | 'sourceMovementId'): string {
    return this.resolveControlError(this.returnForm.controls[controlName].errors);
  }

  protected showDecreaseError(controlName: 'quantity' | 'origin'): boolean {
    const control = this.decreaseForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected decreaseError(controlName: 'quantity' | 'origin'): string {
    return this.resolveControlError(this.decreaseForm.controls[controlName].errors);
  }

  private loadReferenceData(): void {
    if (this.isAdmin()) {
      forkJoin({
        categories: this.inventoryApi.getCategories().pipe(catchError(() => of([] as CatalogEntity[]))),
        units: this.inventoryApi.getUnits().pipe(catchError(() => of([] as UnitOfMeasure[]))),
        providers: this.inventoryApi.getProviders().pipe(catchError(() => of([] as Provider[])))
      })
        .pipe(take(1))
        .subscribe((result) => {
          this.categories.set(result.categories);
          this.units.set(result.units);
          this.providers.set(result.providers);
        });
      return;
    }

    if (this.canManageItems()) {
      this.inventoryApi
        .getProviders()
        .pipe(take(1))
        .subscribe({ next: (providers) => this.providers.set(providers) });
    }
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

    if (errors['min']) {
      return 'Debe ser mayor o igual al minimo permitido.';
    }

    return 'Valor invalido.';
  }
}
