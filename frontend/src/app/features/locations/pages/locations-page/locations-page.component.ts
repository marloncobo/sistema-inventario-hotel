import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { AuthService } from '@core/services/auth.service';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { LOCATION_TYPE_OPTIONS } from '@core/constants/domain-options';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiErrorMessage, extractApiFieldErrors } from '@models/api-error.model';
import type {
  CreateLocationRequest,
  Location,
  UpdateLocationRequest
} from '@models/inventory.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { notBlankValidator } from '@shared/utils/app-validators.util';
import { applyServerValidationErrors } from '@shared/utils/form-errors.util';
import { isHttp403 } from '@shared/utils/http-error.util';

@Component({
  selector: 'app-locations-page',
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
  templateUrl: './locations-page.component.html',
  styleUrls: ['./locations-page.component.css']
})
export class LocationsPageComponent implements OnInit {
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly locationTypes = LOCATION_TYPE_OPTIONS;
  protected readonly locations = signal<Location[]>([]);
  protected readonly parentLocations = signal<Location[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly submitError = signal<string | null>(null);
  protected readonly typeFilter = signal('');
  protected readonly activeFilter = signal<'all' | 'active' | 'inactive'>('active');

  protected readonly locationForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(60), notBlankValidator]],
    name: ['', [Validators.required, Validators.maxLength(120), notBlankValidator]],
    type: ['BODEGA', [Validators.required]],
    parentLocationId: [''],
    roomNumber: ['', [Validators.maxLength(10)]],
    description: ['', [Validators.maxLength(300)]],
    active: [true]
  });

  protected readonly filteredLocations = computed(() => {
    const type = this.typeFilter().trim().toUpperCase();
    const status = this.activeFilter();
    return this.locations().filter((location) => {
      if (type && location.type !== type) {
        return false;
      }
      if (status === 'active' && !location.active) {
        return false;
      }
      if (status === 'inactive' && location.active) {
        return false;
      }
      return true;
    });
  });

  protected readonly activeCount = computed(
    () => this.locations().filter((location) => location.active).length
  );

  ngOnInit(): void {
    this.loadLocations();
  }

  protected canManage(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ALMACENISTA']);
  }

  protected loadLocations(): void {
    this.loading.set(true);
    this.inventoryApi
      .getLocations({ activeOnly: false })
      .pipe(take(1))
      .subscribe({
        next: (locations) => {
          this.locations.set(locations);
          this.parentLocations.set(locations.filter((l) => l.active));
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  protected openCreate(): void {
    if (!this.canManage()) {
      return;
    }
    this.editingId.set(null);
    this.submitError.set(null);
    this.locationForm.reset({
      code: '',
      name: '',
      type: 'BODEGA',
      parentLocationId: '',
      roomNumber: '',
      description: '',
      active: true
    });
    this.dialogVisible.set(true);
  }

  protected openEdit(location: Location): void {
    if (!this.canManage()) {
      return;
    }
    this.editingId.set(location.id);
    this.submitError.set(null);
    this.locationForm.reset({
      code: location.code,
      name: location.name,
      type: location.type,
      parentLocationId: location.parentId ? String(location.parentId) : '',
      roomNumber: location.roomNumber ?? '',
      description: location.description ?? '',
      active: location.active
    });
    this.dialogVisible.set(true);
  }

  protected submit(): void {
    if (!this.canManage() || this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }

    const raw = this.locationForm.getRawValue();
    const parentId = raw.parentLocationId.trim()
      ? Number(raw.parentLocationId)
      : null;

    this.saving.set(true);
    this.submitError.set(null);

    const editingId = this.editingId();
    const request$ =
      editingId === null
        ? this.inventoryApi.createLocation({
            code: raw.code.trim().toUpperCase(),
            name: raw.name.trim(),
            type: raw.type,
            parentLocationId: parentId,
            roomNumber: raw.roomNumber.trim() || null,
            description: raw.description.trim() || null,
            active: raw.active
          } satisfies CreateLocationRequest)
        : this.inventoryApi.updateLocation(editingId, {
            code: raw.code.trim().toUpperCase(),
            name: raw.name.trim(),
            type: raw.type,
            parentLocationId: parentId,
            roomNumber: raw.roomNumber.trim() || null,
            description: raw.description.trim() || null,
            active: raw.active
          } satisfies UpdateLocationRequest);

    request$.pipe(take(1)).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notificationService.success(
          'Ubicaciones',
          editingId === null ? 'Ubicación creada.' : 'Ubicación actualizada.'
        );
        this.loadLocations();
      },
      error: (error) => {
        this.saving.set(false);
        if (isHttp403(error)) {
          return;
        }
        const fieldErrors = extractApiFieldErrors(error.error);
        if (Object.keys(fieldErrors).length) {
          applyServerValidationErrors(this.locationForm, fieldErrors);
          return;
        }
        this.submitError.set(extractApiErrorMessage(error.error));
      }
    });
  }

  protected deactivate(location: Location): void {
    if (!this.canManage() || !location.active) {
      return;
    }
    this.inventoryApi
      .deactivateLocation(location.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.notificationService.success('Ubicaciones', 'Ubicación desactivada.');
          this.loadLocations();
        },
        error: (error) => {
          if (!isHttp403(error)) {
            this.notificationService.error('Ubicaciones', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected typeLabel(value: string): string {
    return value
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
