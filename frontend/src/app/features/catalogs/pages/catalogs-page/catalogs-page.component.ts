import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, Observable, of, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuthService } from '@core/services/auth.service';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiFieldErrors } from '@models/api-error.model';
import type { CatalogEntity, Provider, UnitOfMeasure } from '@models/inventory.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { applyServerValidationErrors } from '@shared/utils/form-errors.util';

type CatalogSection = 'categories' | 'units' | 'providers' | 'areas';

@Component({
  selector: 'app-catalogs-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PageHeaderComponent,
    TableModule,
    TagModule
  ],
  template: `
    <div class="space-y-8">
      <app-page-header
        eyebrow="Configuracion"
        title="Catalogos"
        subtitle="Catalogos maestros del inventario respetando exactamente los endpoints existentes."
      >
        <div header-actions>
          <button
            pButton
            type="button"
            icon="pi pi-plus"
            label="Nuevo registro"
            (click)="openCreate(activeSection())"
          ></button>
        </div>
      </app-page-header>

      @if (!isAdmin()) {
        <article class="note-banner">
          <i class="pi pi-info-circle"></i>
          <div>
            <strong>Restriccion de backend</strong>
            <p class="m-0">
              El rol ALMACENISTA solo puede administrar proveedores. Categorias, unidades y areas
              permanecen ocultas sin alterar seguridad ni rutas del backend.
            </p>
          </div>
        </article>
      }

      <section class="summary-grid">
        @if (isAdmin()) {
          <article class="summary-card">
            <span>Categorias</span>
            <strong>{{ categories().length }}</strong>
            <small>GET /catalogs/categories</small>
          </article>

          <article class="summary-card">
            <span>Unidades</span>
            <strong>{{ units().length }}</strong>
            <small>GET /catalogs/units</small>
          </article>

          <article class="summary-card">
            <span>Areas</span>
            <strong>{{ areas().length }}</strong>
            <small>GET /catalogs/areas</small>
          </article>
        }

        <article class="summary-card">
          <span>Proveedores</span>
          <strong>{{ providers().length }}</strong>
          <small>Disponibles para inventario</small>
        </article>
      </section>

      <section class="surface-card space-y-8">
        <div class="section-switcher">
          @for (section of availableSections(); track section.value) {
            <button
              pButton
              type="button"
              [label]="section.label"
              [severity]="activeSection() === section.value ? 'primary' : 'secondary'"
              (click)="setActiveSection(section.value)"
            ></button>
          }
        </div>

        <div class="app-toolbar">
          <div>
            <h3 class="m-0">{{ currentSectionLabel() }}</h3>
            <small class="text-slate-500">{{ currentSectionEndpoint() }}</small>
          </div>

          <div class="app-toolbar__actions">
            <button
              pButton
              type="button"
              icon="pi pi-refresh"
              label="Recargar"
              severity="secondary"
              variant="outlined"
              [loading]="loading()"
              (click)="loadSection(activeSection())"
            ></button>
          </div>
        </div>

        @switch (activeSection()) {
          @case ('categories') {
            <p-table [value]="categories()" [loading]="loading()" [paginator]="true" [rows]="8" responsiveLayout="scroll">
              <ng-template pTemplate="header">
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-category>
                <tr>
                  <td>{{ category.code }}</td>
                  <td>{{ category.name }}</td>
                  <td>
                    <p-tag [value]="category.active ? 'Activo' : 'Inactivo'" [severity]="category.active ? 'success' : 'danger'"></p-tag>
                  </td>
                  <td class="text-right">
                    <button
                      pButton
                      type="button"
                      icon="pi pi-pen-to-square"
                      label="Editar"
                      size="small"
                      severity="secondary"
                      variant="outlined"
                      (click)="openEdit('categories', category)"
                    ></button>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          }

          @case ('units') {
            <p-table [value]="units()" [loading]="loading()" [paginator]="true" [rows]="8" responsiveLayout="scroll">
              <ng-template pTemplate="header">
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Abreviatura</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-unit>
                <tr>
                  <td>{{ unit.code }}</td>
                  <td>{{ unit.name }}</td>
                  <td>{{ unit.abbreviation || 'Sin abreviatura' }}</td>
                  <td>
                    <p-tag [value]="unit.active ? 'Activo' : 'Inactivo'" [severity]="unit.active ? 'success' : 'danger'"></p-tag>
                  </td>
                  <td class="text-right">
                    <button
                      pButton
                      type="button"
                      icon="pi pi-pen-to-square"
                      label="Editar"
                      size="small"
                      severity="secondary"
                      variant="outlined"
                      (click)="openEdit('units', unit)"
                    ></button>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          }

          @case ('providers') {
            <p-table [value]="providers()" [loading]="loading()" [paginator]="true" [rows]="8" responsiveLayout="scroll">
              <ng-template pTemplate="header">
                <tr>
                  <th>Proveedor</th>
                  <th>Documento</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-provider>
                <tr>
                  <td>
                    <strong>{{ provider.name }}</strong>
                    <div class="text-xs text-slate-500">{{ provider.code || 'Sin codigo' }}</div>
                  </td>
                  <td>{{ provider.documentNumber || 'Sin documento' }}</td>
                  <td>
                    <div>{{ provider.phone || 'Sin telefono' }}</div>
                    <div class="text-xs text-slate-500">{{ provider.email || 'Sin email' }}</div>
                  </td>
                  <td>
                    <p-tag [value]="provider.active ? 'Activo' : 'Inactivo'" [severity]="provider.active ? 'success' : 'danger'"></p-tag>
                  </td>
                  <td class="text-right">
                    <button
                      pButton
                      type="button"
                      icon="pi pi-pen-to-square"
                      label="Editar"
                      size="small"
                      severity="secondary"
                      variant="outlined"
                      (click)="openEdit('providers', provider)"
                    ></button>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          }

          @case ('areas') {
            <p-table [value]="areas()" [loading]="loading()" [paginator]="true" [rows]="8" responsiveLayout="scroll">
              <ng-template pTemplate="header">
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-area>
                <tr>
                  <td>{{ area.code }}</td>
                  <td>{{ area.name }}</td>
                  <td>
                    <p-tag [value]="area.active ? 'Activo' : 'Inactivo'" [severity]="area.active ? 'success' : 'danger'"></p-tag>
                  </td>
                  <td class="text-right">
                    <button
                      pButton
                      type="button"
                      icon="pi pi-pen-to-square"
                      label="Editar"
                      size="small"
                      severity="secondary"
                      variant="outlined"
                      (click)="openEdit('areas', area)"
                    ></button>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          }
        }
      </section>
    </div>

    <p-dialog
      [(visible)]="dialogVisible"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: 'min(48rem, 96vw)' }"
      [header]="editingId() ? 'Editar registro' : 'Crear registro'"
      (onHide)="resetForm()"
    >
      <form [formGroup]="form" class="space-y-8" (ngSubmit)="submit()">
        <div class="form-grid">
          <label class="field">
            <span>Codigo</span>
            <input pInputText type="text" formControlName="code" />
            @if (showControlError('code')) {
              <small>{{ controlError('code') }}</small>
            }
          </label>

          <label class="field">
            <span>Nombre</span>
            <input pInputText type="text" formControlName="name" />
            @if (showControlError('name')) {
              <small>{{ controlError('name') }}</small>
            }
          </label>
        </div>

        @if (dialogSection() === 'units') {
          <div class="form-grid">
            <label class="field">
              <span>Abreviatura</span>
              <input pInputText type="text" formControlName="abbreviation" />
            </label>
          </div>
        }

        @if (dialogSection() === 'providers') {
          <div class="form-grid">
            <label class="field">
              <span>Documento</span>
              <input pInputText type="text" formControlName="documentNumber" />
            </label>

            <label class="field">
              <span>Telefono</span>
              <input pInputText type="text" formControlName="phone" />
            </label>
          </div>

          <div class="form-grid">
            <label class="field">
              <span>Email</span>
              <input pInputText type="email" formControlName="email" />
            </label>
          </div>
        }

        <label class="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input type="checkbox" formControlName="active" />
          Registro activo
        </label>

        <div class="flex justify-end gap-3">
          <button
            pButton
            type="button"
            label="Cancelar"
            severity="secondary"
            variant="text"
            (click)="dialogVisible = false"
          ></button>
          <button pButton type="submit" label="Guardar" [loading]="saving()"></button>
        </div>
      </form>
    </p-dialog>
  `
})
export class CatalogsPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly categories = signal<CatalogEntity[]>([]);
  protected readonly units = signal<UnitOfMeasure[]>([]);
  protected readonly providers = signal<Provider[]>([]);
  protected readonly areas = signal<CatalogEntity[]>([]);
  protected readonly activeSection = signal<CatalogSection>('providers');
  protected readonly dialogSection = signal<CatalogSection>('providers');
  protected readonly editingId = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected dialogVisible = false;

  protected readonly availableSections = computed(() => {
    const sections: Array<{ value: CatalogSection; label: string }> = [
      { value: 'providers', label: 'Proveedores' }
    ];

    if (this.isAdmin()) {
      sections.unshift(
        { value: 'categories', label: 'Categorias' },
        { value: 'units', label: 'Unidades' }
      );
      sections.push({ value: 'areas', label: 'Areas' });
    }

    return sections;
  });

  protected readonly currentSectionLabel = computed(
    () =>
      this.availableSections().find((section) => section.value === this.activeSection())?.label ??
      'Catalogos'
  );

  protected readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    abbreviation: [''],
    documentNumber: [''],
    phone: [''],
    email: [''],
    active: [true]
  });

  ngOnInit(): void {
    this.activeSection.set(this.availableSections()[0]?.value ?? 'providers');
    this.loadOverview();
  }

  protected isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  protected setActiveSection(section: CatalogSection): void {
    this.activeSection.set(section);
    this.loadSection(section);
  }

  protected currentSectionEndpoint(): string {
    switch (this.activeSection()) {
      case 'categories':
        return 'GET /inventory/api/inventory/catalogs/categories';
      case 'units':
        return 'GET /inventory/api/inventory/catalogs/units';
      case 'areas':
        return 'GET /inventory/api/inventory/catalogs/areas';
      default:
        return 'GET /inventory/api/inventory/catalogs/providers';
    }
  }

  protected openCreate(section: CatalogSection): void {
    this.dialogSection.set(section);
    this.editingId.set(null);
    this.form.reset({
      code: '',
      name: '',
      abbreviation: '',
      documentNumber: '',
      phone: '',
      email: '',
      active: true
    });
    this.dialogVisible = true;
  }

  protected openEdit(section: CatalogSection, entity: CatalogEntity | UnitOfMeasure | Provider): void {
    this.dialogSection.set(section);
    this.editingId.set(entity.id);
    this.form.reset({
      code: 'code' in entity && entity.code ? entity.code : '',
      name: entity.name,
      abbreviation: 'abbreviation' in entity ? entity.abbreviation ?? '' : '',
      documentNumber: 'documentNumber' in entity ? entity.documentNumber ?? '' : '',
      phone: 'phone' in entity ? entity.phone ?? '' : '',
      email: 'email' in entity ? entity.email ?? '' : '',
      active: entity.active
    });
    this.dialogVisible = true;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      code: raw.code.trim(),
      name: raw.name.trim(),
      abbreviation: raw.abbreviation.trim() || null,
      documentNumber: raw.documentNumber.trim() || null,
      phone: raw.phone.trim() || null,
      email: raw.email.trim() || null,
      active: raw.active
    };

    const request$ = this.buildSaveRequest(payload);
    request$.pipe(take(1)).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible = false;
        this.resetForm();
        this.notificationService.success('Catalogos', 'Registro guardado correctamente.');
        this.loadSection(this.dialogSection());
      },
      error: (error: { error?: unknown }) => {
        this.saving.set(false);
        applyServerValidationErrors(this.form, extractApiFieldErrors(error.error as never));
      }
    });
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      code: '',
      name: '',
      abbreviation: '',
      documentNumber: '',
      phone: '',
      email: '',
      active: true
    });
  }

  protected showControlError(controlName: 'code' | 'name'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  protected controlError(controlName: 'code' | 'name'): string {
    const control = this.form.controls[controlName];
    if (control.errors?.['server']) {
      return control.errors['server'] as string;
    }

    return 'Este campo es obligatorio.';
  }

  protected loadSection(section: CatalogSection): void {
    this.loading.set(true);
    const request$: Observable<CatalogEntity[] | UnitOfMeasure[] | Provider[]> =
      section === 'categories'
        ? this.inventoryApi.getCategories()
        : section === 'units'
          ? this.inventoryApi.getUnits()
          : section === 'areas'
            ? this.inventoryApi.getAreas()
            : this.inventoryApi.getProviders();

    request$.pipe(take(1)).subscribe({
      next: (rows: CatalogEntity[] | UnitOfMeasure[] | Provider[]) => {
        this.loading.set(false);
        if (section === 'categories') {
          this.categories.set(rows as CatalogEntity[]);
        } else if (section === 'units') {
          this.units.set(rows as UnitOfMeasure[]);
        } else if (section === 'areas') {
          this.areas.set(rows as CatalogEntity[]);
        } else {
          this.providers.set(rows as Provider[]);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private loadOverview(): void {
    this.loading.set(true);

    if (this.isAdmin()) {
      forkJoin({
        categories: this.inventoryApi.getCategories().pipe(catchError(() => of([] as CatalogEntity[]))),
        units: this.inventoryApi.getUnits().pipe(catchError(() => of([] as UnitOfMeasure[]))),
        providers: this.inventoryApi.getProviders().pipe(catchError(() => of([] as Provider[]))),
        areas: this.inventoryApi.getAreas().pipe(catchError(() => of([] as CatalogEntity[])))
      })
        .pipe(take(1))
        .subscribe((result) => {
          this.categories.set(result.categories);
          this.units.set(result.units);
          this.providers.set(result.providers);
          this.areas.set(result.areas);
          this.loading.set(false);
        });
      return;
    }

    this.inventoryApi
      .getProviders()
      .pipe(take(1))
      .subscribe({
        next: (providers) => {
          this.providers.set(providers);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  private buildSaveRequest(payload: {
    code: string;
    name: string;
    abbreviation: string | null;
    documentNumber: string | null;
    phone: string | null;
    email: string | null;
    active: boolean;
  }): Observable<CatalogEntity | UnitOfMeasure | Provider> {
    const id = this.editingId();

    switch (this.dialogSection()) {
      case 'categories':
        return id === null
          ? this.inventoryApi.createCategory(payload)
          : this.inventoryApi.updateCategory(id, payload);
      case 'units':
        return id === null
          ? this.inventoryApi.createUnit(payload)
          : this.inventoryApi.updateUnit(id, payload);
      case 'areas':
        return id === null
          ? this.inventoryApi.createArea(payload)
          : this.inventoryApi.updateArea(id, payload);
      default:
        return id === null
          ? this.inventoryApi.createProvider(payload)
          : this.inventoryApi.updateProvider(id, payload);
    }
  }
}
