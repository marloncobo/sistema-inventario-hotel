import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
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
                [value]="paginatedCategories()"
                [loading]="loading()"
                responsiveLayout="scroll"
                styleClass="catalogs-table"
              >
              <ng-template pTemplate="header">
                <tr>
                  <th class="catalogs-th-mobile-lead" aria-hidden="true"></th>
                  <th>NOMBRE</th>
                  <th>DESCRIPCION</th>
                  <th>ESTADO</th>
                  <th>REGISTRO</th>
                  <th class="text-right">ACCIONES</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-category>
                <tr>
                  <td class="catalogs-td-mobile-lead" aria-hidden="true">
                    <div class="catalogs-mobile-lead__orb">
                      <i [class]="sectionMeta[activeSection()].icon"></i>
                    </div>
                  </td>
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
                [value]="paginatedUnits()"
                [loading]="loading()"
                responsiveLayout="scroll"
                styleClass="catalogs-table"
              >
              <ng-template pTemplate="header">
                <tr>
                  <th class="catalogs-th-mobile-lead" aria-hidden="true"></th>
                  <th>NOMBRE</th>
                  <th>DESCRIPCION</th>
                  <th>ESTADO</th>
                  <th>REGISTRO</th>
                  <th class="text-right">ACCIONES</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-unit>
                <tr>
                  <td class="catalogs-td-mobile-lead" aria-hidden="true">
                    <div class="catalogs-mobile-lead__orb">
                      <i [class]="sectionMeta[activeSection()].icon"></i>
                    </div>
                  </td>
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
                [value]="paginatedProviders()"
                [loading]="loading()"
                responsiveLayout="scroll"
                styleClass="catalogs-table"
              >
              <ng-template pTemplate="header">
                <tr>
                  <th class="catalogs-th-mobile-lead" aria-hidden="true"></th>
                  <th>PROVEEDOR</th>
                  <th>CONTACTO</th>
                  <th>ESTADO</th>
                  <th>REGISTRO</th>
                  <th class="text-right">ACCIONES</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-provider>
                <tr>
                  <td class="catalogs-td-mobile-lead" aria-hidden="true">
                    <div class="catalogs-mobile-lead__orb">
                      <i [class]="sectionMeta[activeSection()].icon"></i>
                    </div>
                  </td>
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
                [value]="paginatedAreas()"
                [loading]="loading()"
                responsiveLayout="scroll"
                styleClass="catalogs-table"
              >
              <ng-template pTemplate="header">
                <tr>
                  <th class="catalogs-th-mobile-lead" aria-hidden="true"></th>
                  <th>NOMBRE</th>
                  <th>DESCRIPCION</th>
                  <th>ESTADO</th>
                  <th>REGISTRO</th>
                  <th class="text-right">ACCIONES</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-area>
                <tr>
                  <td class="catalogs-td-mobile-lead" aria-hidden="true">
                    <div class="catalogs-mobile-lead__orb">
                      <i [class]="sectionMeta[activeSection()].icon"></i>
                    </div>
                  </td>
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

        <div class="pagination-bar catalogs-pagination">
          <span class="pagination-info">
            Mostrando {{ pageStart() }} a {{ pageEnd() }} de {{ currentRows().length }} registros
          </span>
          <div class="pagination-controls">
            <button
              type="button"
              class="pag-btn"
              [disabled]="currentPage() === 1"
              (click)="changePage(1)"
              aria-label="Primera pagina"
            >
              Primera
            </button>
            <button
              type="button"
              class="pag-btn pag-btn--icon"
              [disabled]="currentPage() === 1"
              (click)="changePage(currentPage() - 1)"
              aria-label="Pagina anterior"
            >
              <i class="pi pi-angle-left"></i>
            </button>
            @for (page of visiblePages(); track page) {
              <button
                type="button"
                class="pag-btn"
                [class.active]="page === currentPage()"
                (click)="changePage(page)"
              >
                {{ page }}
              </button>
            }
            <button
              type="button"
              class="pag-btn pag-btn--icon"
              [disabled]="currentPage() === totalPages()"
              (click)="changePage(currentPage() + 1)"
              aria-label="Pagina siguiente"
            >
              <i class="pi pi-angle-right"></i>
            </button>
            <button
              type="button"
              class="pag-btn"
              [disabled]="currentPage() === totalPages()"
              (click)="changePage(totalPages())"
              aria-label="Ultima pagina"
            >
              Ultima
            </button>
          </div>
        </div>
      </section>

      <button
        pButton
        type="button"
        icon="pi pi-plus"
        class="catalogs-mobile-fab"
        aria-label="Nuevo registro"
        (click)="openCreate(activeSection())"
      ></button>
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
      justify-content: center;
      width: 100%;
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

    .pagination-bar {
      padding: 1.5rem 1.2rem 1.2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      background: white;
      border-top: 1px solid rgba(214, 191, 152, 0.18);
    }

    .pagination-info {
      font-size: 0.85rem;
      color: #8a7867;
    }

    .pagination-controls {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .pag-btn {
      min-width: 2.5rem;
      height: 2.25rem;
      padding: 0 0.85rem;
      border-radius: 8px;
      border: 1px solid #f0f0f0;
      background: #fff;
      color: #6e5f50;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pag-btn--icon {
      min-width: 2.4rem;
      padding: 0;
    }

    .pag-btn.active {
      background: #c8922d;
      color: #fff;
      border-color: #c8922d;
      font-weight: 700;
    }

    .pag-btn:hover:not(:disabled):not(.active) {
      color: #b8892a;
      border-color: rgba(200, 146, 45, 0.4);
    }

    .pag-btn:disabled {
      opacity: 0.45;
      cursor: default;
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
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.42rem 0.82rem;
      background: rgba(200, 146, 45, 0.12);
      color: #9b6d18;
    }

    .status-pill::before {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
    }

    .status-pill--inactive {
      background: rgba(145, 158, 171, 0.12);
      color: #64748b;
    }

    .status-pill--inactive::before {
      background: #94a3b8;
      box-shadow: none;
    }

    .catalogs-th-mobile-lead,
    .catalogs-td-mobile-lead {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      overflow: hidden !important;
      visibility: hidden !important;
    }

    .catalogs-mobile-lead__orb {
      width: 3.1rem;
      height: 3.1rem;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: rgba(200, 146, 45, 0.1);
      color: #c8922d;
      font-size: 1.25rem;
      border: 1px solid rgba(200, 146, 45, 0.15);
    }

    .catalogs-mobile-fab {
      display: none;
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

    @media (max-width: 1100px) {
      .catalog-toolbar,
      .catalogs-section-head,
      .catalog-active-filters {
        flex-direction: column;
        align-items: stretch;
      }

      :host ::ng-deep .catalogs-table .p-datatable-table {
        min-width: 48rem;
      }

      .catalog-search {
        max-width: none;
      }

      .catalog-toolbar__controls,
      .catalogs-section-head__actions {
        justify-content: flex-start;
      }
    }

    @media (max-width: 900px) {
      .catalogs-page {
        padding-bottom: 6rem;
      }

      :host ::ng-deep app-page-header .page-header__actions {
        width: 100%;
        display: flex;
        justify-content: center;
      }

      :host ::ng-deep app-page-header .page-header {
        align-items: center;
        text-align: center;
      }

      :host ::ng-deep app-page-header .page-header__copy,
      :host ::ng-deep app-page-header .page-header__subtitle {
        margin-inline: auto;
        text-align: center;
        width: min(100%, 42rem);
      }

      .catalogs-page .summary-grid.catalogs-summary {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
      }

      .catalogs-summary .summary-card {
        grid-template-columns: 1fr;
        justify-items: center;
        text-align: center;
        align-items: flex-start;
        min-height: 0;
        padding: 0.85rem 0.65rem;
        gap: 0.45rem;
      }

      .catalogs-summary__icon {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 0.95rem;
      }

      .catalogs-summary__content span {
        font-size: 0.68rem;
        letter-spacing: 0.07em;
      }

      .catalogs-summary__content strong {
        font-size: 1.85rem;
        line-height: 1.1;
      }

      .catalogs-summary__content small {
        font-size: 0.72rem;
        line-height: 1.35;
      }

      .catalog-tabs {
        overflow-x: auto;
        flex-wrap: nowrap;
        scrollbar-width: none;
        padding-inline: 1rem;
      }

      .catalog-tabs::-webkit-scrollbar {
        display: none;
      }

      .catalog-tab {
        flex: 0 0 auto;
        padding-inline: 0.75rem;
      }

      .catalog-toolbar {
        flex-direction: column;
        align-items: stretch;
        gap: 0.85rem;
        padding: 1rem;
        margin-inline: 0.35rem;
        background: rgba(253, 251, 247, 0.92);
        border: 1px solid rgba(214, 191, 152, 0.2);
        border-radius: 1rem;
        border-bottom: 1px solid rgba(214, 191, 152, 0.18);
      }

      .catalog-search {
        max-width: none;
        flex: 1 1 auto;
      }

      .catalog-toolbar__controls {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        width: 100%;
        gap: 0.55rem 0.65rem;
        justify-content: stretch;
      }

      .catalog-toolbar__controls > .catalog-select {
        grid-column: 1 / -1;
        width: 100%;
        min-width: 0;
      }

      .catalog-toolbar__controls > .catalog-toolbar__button {
        width: 100%;
        min-width: 0;
      }

      .catalogs-section-head {
        flex-direction: column;
        align-items: stretch;
        gap: 0.85rem;
        padding: 1rem;
      }

      .catalogs-section-head__actions {
        justify-content: stretch;
        width: 100%;
        flex-direction: column;
        align-items: stretch;
      }

      .catalogs-section-head__count {
        text-align: center;
      }

      :host ::ng-deep .catalogs-section-head__actions .p-button {
        width: 100%;
      }

      .catalog-active-filters {
        padding-inline: 1rem;
      }

      .catalogs-header-actions {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      :host ::ng-deep .catalogs-create-button.p-button {
        display: none !important;
      }

      .catalogs-pagination {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.75rem;
      }

      .catalogs-pagination .pagination-info {
        width: 100%;
        text-align: center;
      }

      .pagination-bar {
        padding: 1rem;
      }

      .pagination-controls {
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 0.15rem;
        padding-inline: 0.1rem 0.45rem;
        scrollbar-width: none;
        justify-content: center;
      }

      .pagination-controls::-webkit-scrollbar {
        display: none;
      }

      .pag-btn {
        flex: 0 0 auto;
        width: auto;
        min-width: 2.7rem;
      }

      .catalogs-table-wrap {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      :host ::ng-deep .catalogs-table .p-datatable-table {
        min-width: 42rem;
      }

      .dialog-actions {
        flex-direction: column-reverse;
      }

      .catalogs-mobile-fab {
        display: inline-flex;
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        width: 3.6rem;
        height: 3.6rem;
        border-radius: 999px !important;
        z-index: 20;
        box-shadow: 0 18px 32px rgba(200, 146, 45, 0.34) !important;
      }

      :host ::ng-deep .catalogs-mobile-fab.p-button .p-button-label {
        display: none;
      }

      :host ::ng-deep .catalogs-mobile-fab.p-button .p-button-icon {
        margin: 0 !important;
        font-size: 1.35rem;
      }

      .entity-stack__title {
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 0.92rem;
      }

      .entity-stack__title--small {
        text-transform: none;
        letter-spacing: normal;
      }

      :host ::ng-deep .catalogs-table .p-datatable-table {
        min-width: 100% !important;
      }

      :host ::ng-deep .catalogs-table .p-datatable-thead {
        display: none;
      }

      :host ::ng-deep .catalogs-table .p-datatable-tbody {
        padding: 0.95rem;
      }

      :host ::ng-deep .catalogs-table .p-datatable-tbody > tr {
        display: grid;
        grid-template-columns: 3.15rem 1fr auto;
        gap: 0.55rem 0.65rem;
        align-items: start;
        margin-bottom: 0.95rem;
        padding: 1rem;
        border: 1px solid rgba(214, 191, 152, 0.22);
        border-radius: 1.1rem;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(253, 250, 244, 0.96));
        box-shadow: 0 14px 28px rgba(45, 32, 22, 0.05);
      }

      :host ::ng-deep .catalogs-table .p-datatable-tbody > tr:last-child {
        margin-bottom: 0;
      }

      :host ::ng-deep .catalogs-table .p-datatable-tbody > tr > td {
        width: auto !important;
        min-width: 0 !important;
        padding: 0 !important;
        border: none !important;
        text-align: left !important;
        display: block;
        white-space: normal;
        overflow-wrap: break-word;
        word-break: normal;
      }

      :host ::ng-deep .catalogs-table .p-datatable-tbody > tr > td + td {
        margin-top: 0 !important;
        padding-top: 0 !important;
        border-top: none !important;
      }

      :host ::ng-deep .catalogs-table .p-datatable-tbody > tr > td::before {
        display: none !important;
        content: none !important;
      }

      :host ::ng-deep .catalogs-table .p-datatable-tbody > tr > td.catalogs-td-mobile-lead {
        display: flex !important;
        visibility: visible !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: none !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        grid-column: 1;
        grid-row: 1 / span 3;
        align-self: start;
        justify-content: center;
      }

      :host ::ng-deep .catalogs-table .p-datatable-tbody > tr > td:nth-child(2) {
        grid-column: 2;
        grid-row: 1;
      }

      :host ::ng-deep .catalogs-table .p-datatable-tbody > tr > td:nth-child(3) {
        grid-column: 2;
        grid-row: 2;
      }

      :host ::ng-deep .catalogs-table .p-datatable-tbody > tr > td:nth-child(4) {
        grid-column: 3;
        grid-row: 1;
        justify-self: end;
        align-self: start;
      }

      :host ::ng-deep .catalogs-table .p-datatable-tbody > tr > td:nth-child(5) {
        grid-column: 2;
        grid-row: 3;
      }

      :host ::ng-deep .catalogs-table .p-datatable-tbody > tr > td:nth-child(6) {
        grid-column: 3;
        grid-row: 2 / span 2;
        align-self: end;
        justify-self: end;
      }

      :host ::ng-deep .catalogs-table .catalog-action-button {
        width: 2.35rem;
        height: 2.35rem;
        border-radius: 999px;
      }

      :host ::ng-deep .catalogs-table .action-cell,
      :host ::ng-deep .catalogs-table .text-right {
        text-align: right !important;
      }
    }

    @media (max-width: 520px) {
      .pagination-controls .pag-btn:first-child,
      .pagination-controls .pag-btn:last-child {
        display: none;
      }
    }

    @media (max-width: 560px) {
      :host ::ng-deep .catalogs-table .p-datatable-table {
        min-width: 37rem;
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
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 10;
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
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.currentRows().length / this.pageSize))
  );
  protected readonly pageStart = computed(() =>
    this.currentRows().length ? (this.currentPage() - 1) * this.pageSize + 1 : 0
  );
  protected readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.currentRows().length)
  );
  protected readonly paginatedCategories = computed(() =>
    this.paginateRows(this.filteredCategories())
  );
  protected readonly paginatedUnits = computed(() => this.paginateRows(this.filteredUnits()));
  protected readonly paginatedProviders = computed(() =>
    this.paginateRows(this.filteredProviders())
  );
  protected readonly paginatedAreas = computed(() => this.paginateRows(this.filteredAreas()));
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

  constructor() {
    effect(() => {
      this.activeSection();
      this.searchQuery();
      this.statusFilter();
      this.sortOption();
      this.currentPage.set(1);
    });

    effect(() => {
      const total = this.totalPages();
      if (this.currentPage() > total) {
        this.currentPage.set(total);
      }
    });
  }

  ngOnInit(): void {
    this.activeSection.set(this.availableSections()[0]?.value ?? 'providers');
    this.loadOverview();
  }

  protected isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  protected canAccessSection(section: CatalogSection): boolean {
    return section === 'providers' || this.isAdmin();
  }

  protected setActiveSection(section: CatalogSection): void {
    if (!this.canAccessSection(section)) {
      this.activeSection.set('providers');
      return;
    }

    this.activeSection.set(section);
    this.loadSection(section);
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.sortOption.set('name-asc');
    this.filtersPanelOpen.set(false);
    this.currentPage.set(1);
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
    if (!this.canAccessSection(section)) {
      return;
    }
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
    if (!this.canAccessSection(section)) {
      return;
    }

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
    if (!this.canAccessSection(this.dialogSection())) {
      return;
    }

    this.submitError.set(null);

    const generatedCode = this.buildCatalogCode(
      this.form.controls.name.getRawValue(),
      this.form.controls.code.getRawValue()
    );
    this.form.controls.code.setValue(generatedCode);

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
    if (!this.canAccessSection(section)) {
      this.activeSection.set('providers');
      return;
    }

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

  protected currentRows(): Array<CatalogEntity | UnitOfMeasure | Provider> {
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

  protected changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.currentPage.set(page);
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

  private paginateRows<T>(rows: T[]): T[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return rows.slice(start, start + this.pageSize);
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

  private buildCatalogCode(name: string, currentCode: string): string {
    const existing = currentCode.trim();
    if (existing) {
      return existing.slice(0, 40);
    }

    const normalized = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_')
      .slice(0, 32);

    const fallback = `CAT_${Date.now().toString().slice(-6)}`;
    return (normalized || fallback).slice(0, 40);
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
