import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, Observable, of, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { AuthService } from '@core/services/auth.service';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiErrorMessage, extractApiFieldErrors } from '@models/api-error.model';
import type { CatalogEntity, Provider, UnitOfMeasure } from '@models/inventory.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { notBlankValidator } from '@shared/utils/app-validators.util';
import { applyServerValidationErrors } from '@shared/utils/form-errors.util';

type CatalogSection = 'categories' | 'units' | 'providers' | 'areas';
type CatalogStatusFilter = 'all' | 'active' | 'inactive';
type CatalogSortOption = 'name-asc' | 'name-desc' | 'code-asc' | 'code-desc';

const CATALOG_SECTION_META: Record<
  CatalogSection,
  {
    label: string;
    icon: string;
    description: string;
    searchPlaceholder: string;
    summaryNote: string;
    emptyState: string;
    exportName: string;
  }
> = {
  categories: {
    label: 'Categorias',
    icon: 'pi pi-th-large',
    description: 'Listado de clasificaciones base para organizar el inventario.',
    searchPlaceholder: 'Buscar por nombre o codigo...',
    summaryNote: 'Total registradas',
    emptyState: 'No hay categorias que coincidan con los filtros aplicados.',
    exportName: 'catalogos-categorias'
  },
  units: {
    label: 'Unidades',
    icon: 'pi pi-box',
    description: 'Medidas operativas usadas en entradas, salidas y control de stock.',
    searchPlaceholder: 'Buscar por nombre, codigo o abreviatura...',
    summaryNote: 'Total registradas',
    emptyState: 'No hay unidades que coincidan con los filtros aplicados.',
    exportName: 'catalogos-unidades'
  },
  providers: {
    label: 'Proveedores',
    icon: 'pi pi-users',
    description: 'Directorio de proveedores activos para abastecimiento y compras.',
    searchPlaceholder: 'Buscar por nombre, codigo, documento o contacto...',
    summaryNote: 'Total registrados',
    emptyState: 'No hay proveedores que coincidan con los filtros aplicados.',
    exportName: 'catalogos-proveedores'
  },
  areas: {
    label: 'Areas',
    icon: 'pi pi-building-columns',
    description: 'Areas operativas habilitadas para distribucion y consumo interno.',
    searchPlaceholder: 'Buscar por nombre o codigo...',
    summaryNote: 'Total registradas',
    emptyState: 'No hay areas que coincidan con los filtros aplicados.',
    exportName: 'catalogos-areas'
  }
};

const STATUS_OPTIONS: Array<{ value: CatalogStatusFilter; label: string }> = [
  { value: 'all', label: 'Estado: Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' }
];

const SORT_OPTIONS: Array<{ value: CatalogSortOption; label: string }> = [
  { value: 'name-asc', label: 'Ordenar por: Nombre (A-Z)' },
  { value: 'name-desc', label: 'Ordenar por: Nombre (Z-A)' },
  { value: 'code-asc', label: 'Ordenar por: Codigo (A-Z)' },
  { value: 'code-desc', label: 'Ordenar por: Codigo (Z-A)' }
];

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
    TableModule
  ],
  template: `
    <div class="catalogs-page">
      <app-page-header
        eyebrow=""
        title="Catalogos"
        subtitle="Administra categorias, unidades, proveedores y areas desde un solo lugar."
      >
        <div header-actions class="catalogs-header-actions">
          <button
            pButton
            type="button"
            icon="pi pi-plus"
            label="Nuevo registro"
            class="catalogs-create-button"
            (click)="openCreate(activeSection())"
          ></button>
        </div>
      </app-page-header>

      @if (!isAdmin()) {
        <article class="note-banner">
          <i class="pi pi-info-circle"></i>
          <div>
            <strong>Acceso por perfil</strong>
            <p>
              El rol ALMACENISTA solo puede administrar proveedores. Las demas secciones estan
              disponibles solo para perfiles autorizados.
            </p>
          </div>
        </article>
      }

      <section class="summary-grid catalogs-summary admin-kpi-row">
        @for (card of summaryCards(); track card.section) {
          <article class="summary-card">
            <div class="catalogs-summary__icon">
              <i [class]="card.icon"></i>
            </div>
            <div class="catalogs-summary__content">
              <span>{{ card.label }}</span>
              <strong>{{ card.count }}</strong>
              <small>{{ card.note }}</small>
            </div>
          </article>
        }
      </section>

      <section class="surface-card catalogs-workbench admin-content-block">
        <div class="catalog-tabs" role="tablist" aria-label="Secciones de catalogos">
          @for (section of availableSections(); track section.value) {
            <button
              type="button"
              class="catalog-tab"
              [class.is-active]="activeSection() === section.value"
              (click)="setActiveSection(section.value)"
            >
              {{ section.label }}
            </button>
          }
        </div>

        <div class="catalog-toolbar admin-filter-block">
          <label class="catalog-search">
            <i class="pi pi-search"></i>
            <input
              pInputText
              type="text"
              [value]="searchQuery()"
              [placeholder]="sectionMeta[activeSection()].searchPlaceholder"
              (input)="searchQuery.set($any($event.target).value)"
            />
          </label>

          <div class="catalog-toolbar__controls">
            <select
              class="catalog-select"
              aria-label="Filtrar por estado"
              [value]="statusFilter()"
              (change)="statusFilter.set($any($event.target).value)"
            >
              @for (option of statusOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>

            <select
              class="catalog-select"
              aria-label="Ordenar resultados"
              [value]="sortOption()"
              (change)="sortOption.set($any($event.target).value)"
            >
              @for (option of sortOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>

            <button
              pButton
              type="button"
              icon="pi pi-sliders-h"
              label="Filtros"
              severity="secondary"
              variant="outlined"
              class="catalog-toolbar__button"
              [class.catalog-toolbar__button--active]="filtersPanelOpen() || hasFiltersApplied()"
              (click)="toggleFiltersPanel()"
            ></button>

            <button
              pButton
              type="button"
              icon="pi pi-download"
              label="Exportar"
              severity="secondary"
              variant="outlined"
              class="catalog-toolbar__button"
              (click)="exportCurrentSection()"
            ></button>
          </div>
        </div>

        @if (filtersPanelOpen() || hasFiltersApplied()) {
          <div class="catalog-active-filters">
            <div class="catalog-active-filters__chips">
              @if (activeFilterChips().length === 0) {
                <span class="catalog-filter-chip catalog-filter-chip--ghost">
                  Sin filtros activos. Usa la barra superior para refinar resultados.
                </span>
              } @else {
                @for (chip of activeFilterChips(); track chip) {
                  <span class="catalog-filter-chip">{{ chip }}</span>
                }
              }
            </div>

            <button
              pButton
              type="button"
              label="Limpiar"
              severity="secondary"
              variant="text"
              (click)="clearFilters()"
            ></button>
          </div>
        }

        <div class="catalogs-section-head">
          <div class="catalogs-section-head__identity">
            <div class="catalogs-section-head__icon">
              <i [class]="sectionMeta[activeSection()].icon"></i>
            </div>

            <div>
              <h3>{{ currentSectionLabel() }}</h3>
              <p>{{ sectionMeta[activeSection()].description }}</p>
            </div>
          </div>

          <div class="catalogs-section-head__actions">
            <span class="catalogs-section-head__count">{{ currentVisibleCount() }} registros visibles</span>
            <button
              pButton
              type="button"
              icon="pi pi-refresh"
              label="Actualizar"
              severity="secondary"
              variant="outlined"
              [loading]="loading()"
              (click)="loadSection(activeSection())"
            ></button>
          </div>
        </div>

        <div class="catalogs-table-wrap admin-table-block">
          @switch (activeSection()) {
            @case ('categories') {
              <p-table
                [value]="filteredCategories()"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="rowsPerPageOptions"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                responsiveLayout="scroll"
                styleClass="catalogs-table"
              >
              <ng-template pTemplate="header">
                <tr>
                  <th>CODIGO</th>
                  <th>NOMBRE</th>
                  <th>DESCRIPCION</th>
                  <th>ESTADO</th>
                  <th>REGISTRO</th>
                  <th class="text-right">ACCIONES</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-category>
                <tr>
                  <td><span class="code-chip">{{ category.code }}</span></td>
                  <td>
                    <div class="entity-stack">
                      <strong class="entity-stack__title">{{ category.name }}</strong>
                      <span class="entity-stack__meta">Categoria base para clasificar inventario.</span>
                    </div>
                  </td>
                  <td>
                    <span class="muted-copy">{{ describeCategory(category) }}</span>
                  </td>
                  <td>
                    <span class="status-pill" [class.status-pill--inactive]="!category.active">
                      {{ category.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td><span class="registry-pill">{{ formatRegistryLabel(category.id) }}</span></td>
                  <td class="text-right action-cell">
                    <button
                      type="button"
                      class="catalog-action-button"
                      aria-label="Editar categoria"
                      (click)="openEdit('categories', category)"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6">
                    <div class="catalog-empty-state">{{ sectionMeta.categories.emptyState }}</div>
                  </td>
                </tr>
              </ng-template>
              </p-table>
            }

            @case ('units') {
              <p-table
                [value]="filteredUnits()"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="rowsPerPageOptions"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                responsiveLayout="scroll"
                styleClass="catalogs-table"
              >
              <ng-template pTemplate="header">
                <tr>
                  <th>CODIGO</th>
                  <th>NOMBRE</th>
                  <th>DESCRIPCION</th>
                  <th>ESTADO</th>
                  <th>REGISTRO</th>
                  <th class="text-right">ACCIONES</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-unit>
                <tr>
                  <td><span class="code-chip">{{ unit.code }}</span></td>
                  <td>
                    <div class="entity-stack">
                      <strong class="entity-stack__title">{{ unit.name }}</strong>
                      <span class="entity-stack__meta">{{ unit.abbreviation || 'Sin abreviatura' }}</span>
                    </div>
                  </td>
                  <td><span class="muted-copy">{{ describeUnit(unit) }}</span></td>
                  <td>
                    <span class="status-pill" [class.status-pill--inactive]="!unit.active">
                      {{ unit.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td><span class="registry-pill">{{ formatRegistryLabel(unit.id) }}</span></td>
                  <td class="text-right action-cell">
                    <button
                      type="button"
                      class="catalog-action-button"
                      aria-label="Editar unidad"
                      (click)="openEdit('units', unit)"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6">
                    <div class="catalog-empty-state">{{ sectionMeta.units.emptyState }}</div>
                  </td>
                </tr>
              </ng-template>
              </p-table>
            }

            @case ('providers') {
              <p-table
                [value]="filteredProviders()"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="rowsPerPageOptions"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                responsiveLayout="scroll"
                styleClass="catalogs-table"
              >
              <ng-template pTemplate="header">
                <tr>
                  <th>CODIGO</th>
                  <th>PROVEEDOR</th>
                  <th>CONTACTO</th>
                  <th>ESTADO</th>
                  <th>REGISTRO</th>
                  <th class="text-right">ACCIONES</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-provider>
                <tr>
                  <td><span class="code-chip">{{ provider.code || 'SIN-CODIGO' }}</span></td>
                  <td>
                    <div class="entity-stack">
                      <strong class="entity-stack__title">{{ provider.name }}</strong>
                      <span class="entity-stack__meta">{{ provider.documentNumber || 'Sin documento' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="entity-stack">
                      <span class="entity-stack__title entity-stack__title--small">
                        {{ provider.phone || 'Sin telefono' }}
                      </span>
                      <span class="entity-stack__meta">{{ provider.email || 'Sin email registrado' }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="status-pill" [class.status-pill--inactive]="!provider.active">
                      {{ provider.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td><span class="registry-pill">{{ formatRegistryLabel(provider.id) }}</span></td>
                  <td class="text-right action-cell">
                    <button
                      type="button"
                      class="catalog-action-button"
                      aria-label="Editar proveedor"
                      (click)="openEdit('providers', provider)"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6">
                    <div class="catalog-empty-state">{{ sectionMeta.providers.emptyState }}</div>
                  </td>
                </tr>
              </ng-template>
              </p-table>
            }

            @case ('areas') {
              <p-table
                [value]="filteredAreas()"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="rowsPerPageOptions"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                responsiveLayout="scroll"
                styleClass="catalogs-table"
              >
              <ng-template pTemplate="header">
                <tr>
                  <th>CODIGO</th>
                  <th>NOMBRE</th>
                  <th>DESCRIPCION</th>
                  <th>ESTADO</th>
                  <th>REGISTRO</th>
                  <th class="text-right">ACCIONES</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-area>
                <tr>
                  <td><span class="code-chip">{{ area.code }}</span></td>
                  <td>
                    <div class="entity-stack">
                      <strong class="entity-stack__title">{{ area.name }}</strong>
                      <span class="entity-stack__meta">Area habilitada para operacion.</span>
                    </div>
                  </td>
                  <td>
                    <span class="muted-copy">{{ describeArea(area) }}</span>
                  </td>
                  <td>
                    <span class="status-pill" [class.status-pill--inactive]="!area.active">
                      {{ area.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td><span class="registry-pill">{{ formatRegistryLabel(area.id) }}</span></td>
                  <td class="text-right action-cell">
                    <button
                      type="button"
                      class="catalog-action-button"
                      aria-label="Editar area"
                      (click)="openEdit('areas', area)"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6">
                    <div class="catalog-empty-state">{{ sectionMeta.areas.emptyState }}</div>
                  </td>
                </tr>
              </ng-template>
              </p-table>
            }
          }
        </div>
      </section>

    </div>

    <p-dialog
      [(visible)]="dialogVisible"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: 'min(48rem, 96vw)' }"
      styleClass="catalog-dialog"
      [header]="editingId() ? 'Editar registro' : 'Crear registro'"
      (onHide)="resetForm()"
    >
      <form [formGroup]="form" class="catalog-form" (ngSubmit)="submit()">
        @if (submitError(); as error) {
          <article class="validation-banner validation-banner--danger">
            <strong>
              <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
              Corrige la informacion del catalogo
            </strong>
            <p>{{ error }}</p>
          </article>
        }

        <div class="form-grid">
          <label class="field">
            <span>Codigo</span>
            <input pInputText type="text" formControlName="code" maxlength="40" />
            @if (showControlError('code')) {
              <small>{{ controlError('code') }}</small>
            }
          </label>

          <label class="field">
            <span>Nombre</span>
            <input pInputText type="text" formControlName="name" maxlength="180" />
            @if (showControlError('name')) {
              <small>{{ controlError('name') }}</small>
            }
          </label>
        </div>

        @if (dialogSection() === 'units') {
          <div class="form-grid">
            <label class="field">
              <span>Abreviatura</span>
              <input pInputText type="text" formControlName="abbreviation" maxlength="20" />
              @if (showControlError('abbreviation')) {
                <small>{{ controlError('abbreviation') }}</small>
              }
            </label>
          </div>
        }

        @if (dialogSection() === 'providers') {
          <div class="form-grid">
            <label class="field">
              <span>Documento</span>
              <input pInputText type="text" formControlName="documentNumber" maxlength="40" />
              @if (showControlError('documentNumber')) {
                <small>{{ controlError('documentNumber') }}</small>
              }
            </label>

            <label class="field">
              <span>Telefono</span>
              <input pInputText type="text" formControlName="phone" maxlength="40" />
              @if (showControlError('phone')) {
                <small>{{ controlError('phone') }}</small>
              }
            </label>
          </div>

          <div class="form-grid">
            <label class="field">
              <span>Email</span>
              <input pInputText type="email" formControlName="email" maxlength="180" />
              @if (showControlError('email')) {
                <small>{{ controlError('email') }}</small>
              }
            </label>
          </div>
        }

        <div class="status-field">
          <label class="status-field__label">
            <input type="checkbox" formControlName="active" />
            <span>Registro activo</span>
          </label>
          <small>Desactivalo solo cuando no deba usarse en nuevas operaciones.</small>
        </div>

        <div class="dialog-actions">
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
  `,
  styles: `
    .catalogs-page {
      max-width: 1360px;
      margin: 0 auto;
      padding-bottom: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .catalogs-header-actions {
      display: flex;
      align-items: center;
    }

    .note-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.9rem;
      padding: 1rem 1.1rem;
      border-radius: 1rem;
      background: rgba(255, 248, 232, 0.7);
      border: 1px solid rgba(200, 146, 45, 0.18);
      color: #6b5443;
    }

    .note-banner i {
      color: #c8922d;
      font-size: 1rem;
      margin-top: 0.15rem;
    }

    .note-banner p {
      margin: 0.3rem 0 0;
      line-height: 1.5;
    }

    .catalogs-summary .summary-card {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 1rem;
      min-height: 132px;
    }

    .catalogs-summary__icon {
      width: 3rem;
      height: 3rem;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: rgba(200, 146, 45, 0.1);
      color: #c8922d;
      font-size: 1.15rem;
    }

    .catalogs-summary__content {
      min-width: 0;
    }

    .catalogs-summary__content strong {
      display: block;
    }

    .catalogs-workbench {
      padding: 0;
      overflow: hidden;
    }

    .catalog-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      padding: 1rem 1.25rem 0;
      border-bottom: 1px solid rgba(214, 191, 152, 0.26);
    }

    .catalog-tab {
      border: none;
      background: transparent;
      color: #7f6a58;
      font-size: 0.9rem;
      font-weight: 700;
      padding: 0.9rem 1.1rem;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: color 0.2s ease, border-color 0.2s ease;
    }

    .catalog-tab.is-active {
      color: #b57b17;
      border-color: #c8922d;
    }

    .catalog-toolbar {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem;
      border-bottom: 1px solid rgba(214, 191, 152, 0.18);
    }

    .catalog-search {
      position: relative;
      flex: 1 1 320px;
      max-width: 420px;
    }

    .catalog-search i {
      position: absolute;
      top: 50%;
      left: 1rem;
      transform: translateY(-50%);
      color: #9a8a78;
      font-size: 0.9rem;
      pointer-events: none;
      z-index: 1;
    }

    .catalog-search input {
      width: 100%;
      padding-left: 2.7rem !important;
    }

    .catalog-toolbar__controls {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .catalog-select {
      min-width: 180px;
      padding: 0.8rem 0.95rem;
      border-radius: 0.9rem;
      border: 1px solid rgba(214, 191, 152, 0.4);
      background: white;
      color: #5f4a38;
      font-size: 0.92rem;
      outline: none;
    }

    .catalog-active-filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      padding: 0.9rem 1.25rem 1rem;
      border-bottom: 1px solid rgba(214, 191, 152, 0.18);
    }

    .catalog-active-filters__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
    }

    .catalog-filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.75rem;
      border-radius: 999px;
      background: rgba(200, 146, 45, 0.08);
      color: #8f6724;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .catalog-filter-chip--ghost {
      background: rgba(154, 138, 120, 0.08);
      color: #837261;
    }

    .catalogs-section-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: linear-gradient(180deg, rgba(253, 251, 247, 0.96), rgba(255, 255, 255, 0.94));
      border-bottom: 1px solid rgba(214, 191, 152, 0.18);
    }

    .catalogs-section-head__identity {
      display: flex;
      align-items: center;
      gap: 0.95rem;
      min-width: 0;
    }

    .catalogs-section-head__icon {
      width: 2.9rem;
      height: 2.9rem;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: rgba(200, 146, 45, 0.1);
      color: #c8922d;
      flex-shrink: 0;
    }

    .catalogs-section-head__identity h3 {
      margin: 0;
      color: #3d2b1f;
      font-size: 1.12rem;
    }

    .catalogs-section-head__identity p {
      margin: 0.2rem 0 0;
      color: #8a7867;
      font-size: 0.84rem;
      line-height: 1.5;
    }

    .catalogs-section-head__actions {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .catalogs-section-head__count {
      color: #8a7867;
      font-size: 0.82rem;
      font-weight: 600;
    }

    .catalogs-table-wrap {
      overflow: hidden;
      background: white;
    }

    .entity-stack {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }

    .entity-stack__title {
      color: #3d2b1f;
      font-weight: 700;
      line-height: 1.35;
    }

    .entity-stack__title--small {
      font-size: 0.92rem;
    }

    .entity-stack__meta {
      color: #9a8a78;
      font-size: 0.78rem;
      line-height: 1.45;
    }

    .code-chip,
    .registry-pill,
    .status-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      border-radius: 999px;
      font-size: 0.76rem;
      font-weight: 700;
    }

    .code-chip {
      padding: 0.4rem 0.72rem;
      background: rgba(200, 146, 45, 0.08);
      color: #8e641c;
      letter-spacing: 0.03em;
    }

    .registry-pill {
      padding: 0.42rem 0.7rem;
      background: rgba(154, 138, 120, 0.08);
      color: #766553;
    }

    .status-pill {
      padding: 0.42rem 0.82rem;
      background: rgba(200, 146, 45, 0.12);
      color: #9b6d18;
    }

    .status-pill--inactive {
      background: rgba(145, 158, 171, 0.12);
      color: #64748b;
    }

    .muted-copy {
      color: #7f6f60;
      font-size: 0.84rem;
      line-height: 1.5;
    }

    .action-cell {
      white-space: nowrap;
    }

    .catalog-action-button {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.8rem;
      border: 1px solid rgba(200, 146, 45, 0.25);
      background: white;
      color: #b27b1f;
      cursor: pointer;
      transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    }

    .catalog-action-button:hover {
      transform: translateY(-1px);
      background: rgba(255, 248, 232, 0.8);
      border-color: rgba(200, 146, 45, 0.45);
    }

    .catalog-empty-state {
      padding: 1.5rem 0;
      text-align: center;
      color: #8a7867;
      font-size: 0.9rem;
    }

    .catalog-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding-top: 0.25rem;
    }

    .status-field {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      padding: 1rem 1.1rem;
      border-radius: 1rem;
      background: #fcfaf6;
      border: 1px solid rgba(214, 191, 152, 0.2);
    }

    .status-field__label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #3d2b1f;
      font-size: 0.92rem;
      font-weight: 600;
    }

    .status-field input[type='checkbox'] {
      width: 1rem;
      height: 1rem;
      accent-color: var(--app-gold);
    }

    .status-field small {
      color: #8d7b67;
      font-size: 0.78rem;
      line-height: 1.45;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.25rem;
    }

    :host ::ng-deep app-page-header .page-header {
      padding-bottom: 0;
      margin-bottom: 0;
      border-bottom: none;
      align-items: center;
    }

    :host ::ng-deep .catalogs-create-button.p-button {
      border-radius: 0.9rem;
      padding-inline: 1.1rem;
      box-shadow: 0 12px 24px rgba(200, 146, 45, 0.22);
      color: #ffffff !important;
    }

    :host ::ng-deep .catalogs-create-button.p-button .p-button-label,
    :host ::ng-deep .catalogs-create-button.p-button .p-button-icon {
      color: inherit !important;
    }

    :host ::ng-deep .catalog-toolbar__button.p-button,
    :host ::ng-deep .catalogs-section-head__actions .p-button {
      border-radius: 0.85rem;
    }

    :host ::ng-deep .catalog-toolbar__button--active.p-button {
      border-color: rgba(200, 146, 45, 0.5);
      color: #b27b1f;
      background: rgba(255, 248, 232, 0.55);
    }

    :host ::ng-deep .catalogs-table .p-datatable-table {
      min-width: 62rem;
    }

    :host ::ng-deep .catalogs-table .p-datatable-thead > tr > th {
      padding: 1rem 1.25rem;
      background: #fdfbf7;
      color: #7b6754;
      font-size: 0.73rem;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    :host ::ng-deep .catalogs-table .p-datatable-tbody > tr > td {
      padding: 1rem 1.25rem;
      vertical-align: middle;
    }

    :host ::ng-deep .catalogs-table .p-datatable-tbody > tr:last-child > td {
      border-bottom: none;
    }

    :host ::ng-deep .catalogs-table .p-paginator {
      border: none;
      border-top: 1px solid rgba(214, 191, 152, 0.18);
      padding: 0.95rem 1.2rem;
      justify-content: space-between;
      gap: 1rem;
    }

    :host ::ng-deep .catalogs-table .p-paginator-current {
      color: #8a7867;
      font-size: 0.82rem;
    }

    :host ::ng-deep .catalog-dialog .p-dialog-content {
      padding-top: 0.5rem;
    }

    @media (max-width: 960px) {
      .catalog-toolbar,
      .catalogs-section-head,
      .catalog-active-filters {
        flex-direction: column;
        align-items: stretch;
      }

      .catalog-search {
        max-width: none;
      }

      .catalog-toolbar__controls,
      .catalogs-section-head__actions {
        justify-content: flex-start;
      }
    }

    @media (max-width: 720px) {
      .catalogs-summary .summary-card {
        grid-template-columns: 1fr;
        align-items: flex-start;
      }

      .catalog-tabs,
      .catalog-toolbar,
      .catalogs-section-head {
        padding-inline: 1rem;
      }

      .catalog-tab {
        padding-inline: 0.75rem;
      }

      .catalog-select {
        width: 100%;
      }

      .catalog-toolbar__controls > * {
        width: 100%;
      }

      .dialog-actions {
        flex-direction: column-reverse;
      }
    }
  `
})
export class CatalogsPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly sectionMeta = CATALOG_SECTION_META;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly rowsPerPageOptions = [10, 20, 50];

  protected readonly categories = signal<CatalogEntity[]>([]);
  protected readonly units = signal<UnitOfMeasure[]>([]);
  protected readonly providers = signal<Provider[]>([]);
  protected readonly areas = signal<CatalogEntity[]>([]);
  protected readonly activeSection = signal<CatalogSection>('providers');
  protected readonly dialogSection = signal<CatalogSection>('providers');
  protected readonly editingId = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<CatalogStatusFilter>('all');
  protected readonly sortOption = signal<CatalogSortOption>('name-asc');
  protected readonly filtersPanelOpen = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected dialogVisible = false;

  protected readonly availableSections = computed(() => {
    const sections: Array<{ value: CatalogSection; label: string }> = [
      { value: 'providers', label: CATALOG_SECTION_META.providers.label }
    ];

    if (this.isAdmin()) {
      sections.unshift(
        { value: 'categories', label: CATALOG_SECTION_META.categories.label },
        { value: 'units', label: CATALOG_SECTION_META.units.label }
      );
      sections.push({ value: 'areas', label: CATALOG_SECTION_META.areas.label });
    }

    return sections;
  });

  protected readonly summaryCards = computed(() =>
    this.availableSections().map((section) => ({
      section: section.value,
      label: CATALOG_SECTION_META[section.value].label,
      icon: CATALOG_SECTION_META[section.value].icon,
      count: this.sectionCount(section.value),
      note: CATALOG_SECTION_META[section.value].summaryNote
    }))
  );

  protected readonly currentSectionLabel = computed(
    () => this.sectionMeta[this.activeSection()].label ?? 'Catalogos'
  );

  protected readonly filteredCategories = computed(() =>
    this.sortRows(
      this.categories().filter(
        (category) =>
          this.matchesStatus(category.active) &&
          this.matchesQuery([category.code, category.name], this.normalizedQuery())
      ),
      (category) => category.name,
      (category) => category.code
    )
  );

  protected readonly filteredUnits = computed(() =>
    this.sortRows(
      this.units().filter(
        (unit) =>
          this.matchesStatus(unit.active) &&
          this.matchesQuery([unit.code, unit.name, unit.abbreviation], this.normalizedQuery())
      ),
      (unit) => unit.name,
      (unit) => unit.code
    )
  );

  protected readonly filteredProviders = computed(() =>
    this.sortRows(
      this.providers().filter(
        (provider) =>
          this.matchesStatus(provider.active) &&
          this.matchesQuery(
            [provider.code, provider.name, provider.documentNumber, provider.phone, provider.email],
            this.normalizedQuery()
          )
      ),
      (provider) => provider.name,
      (provider) => provider.code ?? provider.name
    )
  );

  protected readonly filteredAreas = computed(() =>
    this.sortRows(
      this.areas().filter(
        (area) =>
          this.matchesStatus(area.active) &&
          this.matchesQuery([area.code, area.name], this.normalizedQuery())
      ),
      (area) => area.name,
      (area) => area.code
    )
  );

  protected readonly currentVisibleCount = computed(() => this.currentRows().length);

  protected readonly hasFiltersApplied = computed(
    () =>
      this.searchQuery().trim().length > 0 ||
      this.statusFilter() !== 'all' ||
      this.sortOption() !== 'name-asc'
  );

  protected readonly activeFilterChips = computed(() => {
    const chips: string[] = [];
    const query = this.searchQuery().trim();

    if (query) {
      chips.push(`Busqueda: ${query}`);
    }

    if (this.statusFilter() !== 'all') {
      chips.push(`Estado: ${this.statusFilter() === 'active' ? 'Activos' : 'Inactivos'}`);
    }

    const sortLabel = this.sortOptions.find((option) => option.value === this.sortOption())?.label;
    if (sortLabel && this.sortOption() !== 'name-asc') {
      chips.push(sortLabel);
    }

    return chips;
  });

  protected readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, notBlankValidator, Validators.maxLength(40)]],
    name: ['', [Validators.required, notBlankValidator, Validators.maxLength(180)]],
    abbreviation: ['', [Validators.maxLength(20)]],
    documentNumber: ['', [Validators.maxLength(40)]],
    phone: ['', [Validators.maxLength(40)]],
    email: ['', [Validators.email, Validators.maxLength(180)]],
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

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.sortOption.set('name-asc');
    this.filtersPanelOpen.set(false);
  }

  protected toggleFiltersPanel(): void {
    this.filtersPanelOpen.update((current) => !current);
  }

  protected describeCategory(category: CatalogEntity): string {
    return `Codigo interno ${category.code} listo para clasificar insumos y materiales.`;
  }

  protected describeUnit(unit: UnitOfMeasure): string {
    return unit.abbreviation
      ? `Abreviatura operativa: ${unit.abbreviation}.`
      : 'Unidad disponible para movimientos y control de stock.';
  }

  protected describeArea(area: CatalogEntity): string {
    return `Codigo interno ${area.code} habilitado para distribucion y consumo interno.`;
  }

  protected formatRegistryLabel(id: number): string {
    return `ID ${id.toString().padStart(4, '0')}`;
  }

  protected openCreate(section: CatalogSection): void {
    this.submitError.set(null);
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
    this.submitError.set(null);
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
    this.submitError.set(null);

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
        const fieldErrors = extractApiFieldErrors(error.error as never);
        if (Object.keys(fieldErrors).length) {
          applyServerValidationErrors(this.form, fieldErrors);
          this.submitError.set('Revisa los campos marcados antes de guardar.');
          return;
        }

        this.submitError.set(extractApiErrorMessage(error.error as never));
      }
    });
  }

  protected resetForm(): void {
    this.submitError.set(null);
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

  protected showControlError(
    controlName: 'code' | 'name' | 'abbreviation' | 'documentNumber' | 'phone' | 'email'
  ): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  protected controlError(
    controlName: 'code' | 'name' | 'abbreviation' | 'documentNumber' | 'phone' | 'email'
  ): string {
    const control = this.form.controls[controlName];
    if (control.errors?.['server']) {
      return control.errors['server'] as string;
    }

    if (control.errors?.['required']) {
      return 'Este campo es obligatorio.';
    }

    if (control.errors?.['blank']) {
      return 'No puede quedar en blanco.';
    }

    if (control.errors?.['maxlength']) {
      return `No puede superar ${control.errors['maxlength'].requiredLength} caracteres.`;
    }

    if (control.errors?.['email']) {
      return 'Debes ingresar un correo valido.';
    }

    return 'Valor invalido.';
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

  protected exportCurrentSection(): void {
    const rows = this.currentExportRows();
    if (!rows.length) {
      this.notificationService.warn('Catalogos', 'No hay registros visibles para exportar.');
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => this.escapeCsvValue(row[header])).join(','))
    ];

    const blob = new Blob([`\uFEFF${csvLines.join('\n')}`], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${this.sectionMeta[this.activeSection()].exportName}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);

    this.notificationService.success('Catalogos', 'Exportacion generada correctamente.');
  }

  private sectionCount(section: CatalogSection): number {
    switch (section) {
      case 'categories':
        return this.categories().length;
      case 'units':
        return this.units().length;
      case 'areas':
        return this.areas().length;
      default:
        return this.providers().length;
    }
  }

  private currentRows(): Array<CatalogEntity | UnitOfMeasure | Provider> {
    switch (this.activeSection()) {
      case 'categories':
        return this.filteredCategories();
      case 'units':
        return this.filteredUnits();
      case 'areas':
        return this.filteredAreas();
      default:
        return this.filteredProviders();
    }
  }

  private currentExportRows(): Array<Record<string, string>> {
    switch (this.activeSection()) {
      case 'categories':
        return this.filteredCategories().map((category) => ({
          Codigo: category.code,
          Nombre: category.name,
          Descripcion: this.describeCategory(category),
          Estado: category.active ? 'Activo' : 'Inactivo',
          Registro: this.formatRegistryLabel(category.id)
        }));
      case 'units':
        return this.filteredUnits().map((unit) => ({
          Codigo: unit.code,
          Nombre: unit.name,
          Descripcion: this.describeUnit(unit),
          Estado: unit.active ? 'Activo' : 'Inactivo',
          Registro: this.formatRegistryLabel(unit.id)
        }));
      case 'areas':
        return this.filteredAreas().map((area) => ({
          Codigo: area.code,
          Nombre: area.name,
          Descripcion: this.describeArea(area),
          Estado: area.active ? 'Activo' : 'Inactivo',
          Registro: this.formatRegistryLabel(area.id)
        }));
      default:
        return this.filteredProviders().map((provider) => ({
          Codigo: provider.code || 'SIN-CODIGO',
          Proveedor: provider.name,
          Documento: provider.documentNumber || '',
          Telefono: provider.phone || '',
          Email: provider.email || '',
          Estado: provider.active ? 'Activo' : 'Inactivo',
          Registro: this.formatRegistryLabel(provider.id)
        }));
    }
  }

  private matchesStatus(active: boolean): boolean {
    return this.statusFilter() === 'all'
      ? true
      : this.statusFilter() === 'active'
        ? active
        : !active;
  }

  private normalizedQuery(): string {
    return this.searchQuery().trim().toLowerCase();
  }

  private matchesQuery(values: Array<string | null | undefined>, query: string): boolean {
    if (!query) {
      return true;
    }

    return values.some((value) => (value ?? '').toLowerCase().includes(query));
  }

  private sortRows<T>(rows: T[], getName: (row: T) => string, getCode: (row: T) => string): T[] {
    const sorted = [...rows];

    sorted.sort((left, right) => {
      const comparison =
        this.sortOption() === 'name-asc' || this.sortOption() === 'name-desc'
          ? this.compareText(getName(left), getName(right))
          : this.compareText(getCode(left), getCode(right));

      return this.sortOption() === 'name-desc' || this.sortOption() === 'code-desc'
        ? comparison * -1
        : comparison;
    });

    return sorted;
  }

  private compareText(left: string | null | undefined, right: string | null | undefined): number {
    return (left ?? '').localeCompare(right ?? '', 'es', { sensitivity: 'base' });
  }

  private escapeCsvValue(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
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
