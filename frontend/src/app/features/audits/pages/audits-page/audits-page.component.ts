import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { startWith, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuditApiService } from '@core/services/api/audit-api.service';
import type { AuditFilters, AuditLog } from '@models/audit.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SelectModule } from 'primeng/select';

type AuditScope = 'auth' | 'inventory' | 'rooms';

const AUDIT_SCOPE_META: Record<
  AuditScope,
  {
    label: string;
    icon: string;
    description: string;
  }
> = {
  auth: {
    label: 'Autenticación',
    icon: 'pi pi-shield',
    description: 'Eventos de acceso, validación de sesiones y cambios de seguridad.'
  },
  inventory: {
    label: 'Inventario',
    icon: 'pi pi-box',
    description: 'Trazabilidad de movimientos, ajustes y operaciones sobre existencias.'
  },
  rooms: {
    label: 'Habitaciones',
    icon: 'pi pi-home',
    description: 'Bitácora operativa de entregas, consumos y actividad sobre habitaciones.'
  }
};

type AuditActionOption = {
  label: string;
  value: string;
};

const AUDIT_ACTION_OPTIONS: Record<AuditScope, AuditActionOption[]> = {
  auth: [
    { label: 'Inicio de sesión exitoso', value: 'LOGIN_SUCCESS' },
    { label: 'Inicio de sesión fallido', value: 'LOGIN_FAILED' },
    { label: 'Crear usuario', value: 'CREATE' },
    { label: 'Actualizar usuario', value: 'UPDATE' }
  ],
  inventory: [
    { label: 'Consultar ítems', value: 'QUERY_ITEMS' },
    { label: 'Consultar movimientos', value: 'QUERY_MOVEMENTS' },
    { label: 'Consultar stock bajo', value: 'QUERY_LOW_STOCK' },
    { label: 'Consultar alertas stock bajo', value: 'QUERY_LOW_STOCK_ALERTS' },
    { label: 'Generar reporte inventario', value: 'GENERATE_INVENTORY_REPORT' },
    { label: 'Generar reporte más usados', value: 'GENERATE_TOP_USED_REPORT' },
    { label: 'Exportar reporte inventario', value: 'EXPORT_INVENTORY_REPORT' },
    { label: 'Exportar reporte más usados', value: 'EXPORT_TOP_USED_REPORT' },
    { label: 'Crear', value: 'CREATE' },
    { label: 'Actualizar', value: 'UPDATE' },
    { label: 'Desactivar', value: 'DEACTIVATE' },
    { label: 'Entrada de stock', value: 'STOCK_ENTRY' },
    { label: 'Salida de stock', value: 'STOCK_EXIT' },
    { label: 'Retorno de stock', value: 'STOCK_RETURN' },
    { label: 'Anular movimiento', value: 'VOID_MOVEMENT' }
  ],
  rooms: [
    { label: 'Consultar asignaciones por habitación', value: 'QUERY_ROOM_ASSIGNMENTS' },
    { label: 'Consultar asignaciones', value: 'QUERY_ASSIGNMENTS' },
    { label: 'Generar reporte consumo', value: 'GENERATE_ROOM_CONSUMPTION_REPORT' },
    { label: 'Exportar reporte consumo', value: 'EXPORT_ROOM_CONSUMPTION_REPORT' },
    { label: 'Generar reporte distribución', value: 'GENERATE_ROOM_DISTRIBUTION_REPORT' },
    { label: 'Exportar reporte distribución', value: 'EXPORT_ROOM_DISTRIBUTION_REPORT' },
    { label: 'Crear habitación', value: 'CREATE' },
    { label: 'Actualizar habitación', value: 'UPDATE' },
    { label: 'Actualizar estado', value: 'UPDATE_STATUS' },
    { label: 'Asignar insumo', value: 'ASSIGN_SUPPLY' }
  ]
};

@Component({
  selector: 'app-audits-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PageHeaderComponent,
    TableModule,
    SelectModule,
    TagModule
  ],
  template: `
    <div class="audits-page">
      <app-page-header
        eyebrow="Control"
        title="Auditoría"
        subtitle="Consulta unificada de eventos de acceso, inventario y habitaciones."
      />

      <section class="summary-grid audits-summary admin-kpi-row">
        <article class="summary-card audits-summary-card audits-summary-card--scope">
          <div class="audits-summary-card__icon">
            <i [class]="currentScopeMeta().icon"></i>
          </div>
          <div class="audits-summary-card__content">
            <span>Alcance activo</span>
            <strong class="audits-summary-card__title">{{ currentScopeMeta().label }}</strong>
            <small>{{ currentScopeMeta().description }}</small>
          </div>
        </article>

        <article class="summary-card audits-summary-card">
          <div class="audits-summary-card__icon">
            <i class="pi pi-database"></i>
          </div>
          <div class="audits-summary-card__content">
            <span>Eventos</span>
            <strong>{{ formatMetric(logs().length) }}</strong>
            <small>Filas visibles en la consulta</small>
          </div>
        </article>

        <article class="summary-card audits-summary-card">
          <div class="audits-summary-card__icon">
            <i class="pi pi-users"></i>
          </div>
          <div class="audits-summary-card__content">
            <span>Usuarios únicos</span>
            <strong>{{ formatMetric(uniqueUsers()) }}</strong>
            <small>Basado en la consulta actual</small>
          </div>
        </article>

        <article class="summary-card audits-summary-card">
          <div class="audits-summary-card__icon">
            <i class="pi pi-bolt"></i>
          </div>
          <div class="audits-summary-card__content">
            <span>Acciones únicas</span>
            <strong>{{ formatMetric(uniqueActions()) }}</strong>
            <small>Variedad de eventos registrados</small>
          </div>
        </article>
      </section>

      <section class="surface-card audits-workbench admin-content-block">
        <div class="audit-tabs" role="tablist" aria-label="Alcances de auditoría">
          @for (scope of scopes; track scope.value) {
            <button
              type="button"
              class="audit-tab"
              [class.is-active]="activeScope() === scope.value"
              (click)="setScope(scope.value)"
            >
              {{ scope.label }}
            </button>
          }
        </div>

        <form [formGroup]="filtersForm" class="audit-filter-shell admin-filter-block" (ngSubmit)="search()">
          <div class="filters-grid audits-filters-grid">
            <label class="field">
              <span>Acción</span>
              <p-select
                formControlName="action"
                [options]="currentActionOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecciona una acción"
                [showClear]="false"
                styleClass="w-full"
              />
            </label>

            <label class="field">
              <span>Usuario</span>
              <input pInputText type="text" formControlName="username" placeholder="Nombre de usuario" />
            </label>

            <label class="field">
              <span>Fecha inicial</span>
              <input class="field-control" type="date" formControlName="startDate" />
            </label>

            <label class="field">
              <span>Fecha final</span>
              <input class="field-control" type="date" formControlName="endDate" />
            </label>
          </div>

          <div class="audit-filter-shell__actions">
            <button
              pButton
              type="submit"
              class="audit-btn-primary"
              icon="pi pi-filter"
              label="Consultar"
              [loading]="loading()"
            ></button>

            <button
              pButton
              type="button"
              icon="pi pi-eraser"
              label="Limpiar"
              severity="secondary"
              variant="outlined"
              (click)="clearFilters()"
            ></button>
          </div>
        </form>

        @if (activeFilterCount() > 0) {
          <div class="audits-active-filters">
            @for (chip of activeFilterChips(); track chip) {
              <span class="audits-chip">{{ chip }}</span>
            }
          </div>
        }

        <div class="audits-results-head">
          <h3>Resultados</h3>
        </div>

        <div class="audits-table-wrap admin-table-block">
          @if (!loading() && !logs().length) {
            <div class="audits-empty-state">
              <i class="pi pi-search"></i>
              <strong>Sin eventos para esta consulta</strong>
              <p>Ajusta los filtros o cambia de alcance para revisar otra bitácora.</p>
            </div>
          } @else {
            <p-table
              [value]="logs()"
              [loading]="loading()"
              [paginator]="true"
              [rows]="10"
              [showCurrentPageReport]="true"
              paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
              currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} eventos"
              responsiveLayout="scroll"
              styleClass="audits-table"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>Fecha</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Usuario</th>
                  <th>Detalle</th>
                  <th class="audits-th-chevron" aria-hidden="true"></th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-log>
                <tr>
                  <td><span class="audit-date">{{ formatDate(log.createdAt) }}</span></td>
                  <td><span class="audit-action-tag">{{ log.action }}</span></td>
                  <td>
                    <div class="audit-entity">
                      <strong>{{ log.entityName }}</strong>
                      <span>{{ log.entityId !== null ? 'ID #' + log.entityId : 'Sin referencia' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="audit-entity">
                      <strong>{{ log.username }}</strong>
                      <span>{{ currentScopeLabel() }}</span>
                    </div>
                  </td>
                  <td><span class="audit-detail">{{ log.detail || 'Sin detalle' }}</span></td>
                  <td class="audits-td-chevron" aria-hidden="true">
                    <i class="pi pi-angle-right audits-row-chevron-icon"></i>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .audits-page {
      max-width: 1480px;
      margin: 0 auto;
      padding-bottom: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .audits-summary-card {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 1rem;
      min-height: 132px;
    }

    .audits-summary-card__icon {
      width: 3rem;
      height: 3rem;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: rgba(200, 146, 45, 0.1);
      color: #c8922d;
      font-size: 1.15rem;
    }

    .audits-summary-card__content {
      min-width: 0;
    }

    .audits-summary-card__content strong {
      display: block;
    }

    .audits-summary-card__title {
      font-family: var(--app-font-sans);
      font-size: 1.2rem !important;
      line-height: 1.25 !important;
      margin-top: 0.45rem !important;
    }

    .audits-workbench {
      padding: 0;
      overflow: hidden;
    }

    .audit-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      padding: 1rem 1.25rem 0;
      border-bottom: 1px solid rgba(214, 191, 152, 0.26);
    }

    .audit-tab {
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

    .audit-tab.is-active {
      color: #b57b17;
      border-color: #c8922d;
    }

    .audit-filter-shell {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.25rem;
      border-bottom: 1px solid rgba(214, 191, 152, 0.18);
    }

    .audits-filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: 1rem 1.25rem;
    }

    :host ::ng-deep .audit-filter-shell .p-select {
      min-height: 3.45rem;
      align-items: center;
    }

    :host ::ng-deep .audit-filter-shell .p-select-label,
    .audit-filter-shell .field-control {
      padding: 0.66rem 0.9rem !important;
      font-size: 0.88rem !important;
      line-height: 1.2 !important;
      color: #1f1f1f !important;
    }

    .audit-filter-shell__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    :host ::ng-deep .audit-btn-primary.p-button {
      background: #c8922d;
      border-color: #c8922d;
      color: #ffffff;
    }

    :host ::ng-deep .audit-btn-primary.p-button .p-button-label,
    :host ::ng-deep .audit-btn-primary.p-button .p-button-icon {
      color: #ffffff;
    }

    .audits-active-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      padding: 0 1.25rem 1.15rem;
      border-bottom: 1px solid rgba(214, 191, 152, 0.18);
    }

    .audits-chip {
      display: inline-flex;
      align-items: center;
      padding: 0.45rem 0.75rem;
      border-radius: 999px;
      background: rgba(200, 146, 45, 0.08);
      color: #8f6724;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .audits-results-head {
      padding: 0.95rem 1.25rem 0.15rem;
    }

    .audits-results-head h3 {
      margin: 0;
      color: #3d2b1f;
      font-size: 1.5rem;
      line-height: 1.1;
    }

    .audits-table-wrap {
      overflow: hidden;
      background: white;
    }

    .audits-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 3rem 1.5rem;
      text-align: center;
      color: #8a7867;
    }

    .audits-empty-state i {
      font-size: 1.5rem;
      color: #c8922d;
    }

    .audits-empty-state strong {
      color: #3d2b1f;
      font-size: 1rem;
    }

    .audits-empty-state p {
      margin: 0;
      max-width: 30rem;
      line-height: 1.5;
    }

    .audit-date {
      color: #5f4a38;
      font-weight: 600;
      white-space: nowrap;
    }

    .audit-entity {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }

    .audit-entity strong {
      color: #3d2b1f;
      font-weight: 700;
      line-height: 1.35;
    }

    .audit-entity span {
      color: #9a8a78;
      font-size: 0.78rem;
      line-height: 1.45;
    }

    .audit-detail {
      color: #7f6f60;
      font-size: 0.84rem;
      line-height: 1.5;
    }

    .audit-action-tag {
      display: inline-flex;
      padding: 0.38rem 0.72rem;
      border-radius: 999px;
      font-size: 0.74rem;
      font-weight: 700;
      color: #8e641c;
      background: rgba(200, 146, 45, 0.12);
      border: 1px solid rgba(200, 146, 45, 0.2);
    }

    .audits-th-chevron,
    .audits-td-chevron {
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

    :host ::ng-deep app-page-header .page-header {
      padding-bottom: 0;
      margin-bottom: 0;
      border-bottom: none;
      align-items: center;
    }

    :host ::ng-deep .audits-table .p-datatable-table {
      min-width: 60rem;
    }

    :host ::ng-deep .audits-table .p-datatable-thead > tr > th {
      padding: 1rem 1.15rem;
      background: #fdfbf7;
      color: #7b6754;
      font-size: 0.73rem;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    :host ::ng-deep .audits-table .p-datatable-tbody > tr > td {
      padding: 1rem 1.15rem;
      vertical-align: middle;
    }

    :host ::ng-deep .audits-table .p-datatable-tbody > tr:last-child > td {
      border-bottom: none;
    }

    :host ::ng-deep .audits-table .p-paginator {
      border: none;
      border-top: 1px solid rgba(214, 191, 152, 0.18);
      padding: 0.95rem 1.15rem;
      justify-content: space-between;
      gap: 1rem;
    }

    :host ::ng-deep .audits-table .p-paginator-current {
      color: #8a7867;
      font-size: 0.82rem;
    }

    :host ::ng-deep .audits-table .p-paginator .p-paginator-element {
      color: #b57b17;
    }

    :host ::ng-deep .audits-table .p-paginator .p-paginator-element:hover {
      background: rgba(200, 146, 45, 0.12);
      color: #9b6d18;
    }

    :host ::ng-deep .audits-table .p-paginator .p-paginator-page.p-highlight {
      background: #c8922d;
      border-color: #c8922d;
      color: #ffffff;
    }

    :host ::ng-deep .audits-table .p-paginator .p-paginator-page.p-highlight:hover,
    :host ::ng-deep .audits-table .p-paginator .p-paginator-page.p-highlight:focus {
      background: #c8922d;
      border-color: #c8922d;
      color: #ffffff;
    }

    @media (min-width: 901px) {
      :host ::ng-deep .audits-table .p-paginator {
        border: none;
        border-top: 1px solid rgba(214, 191, 152, 0.18);
        padding: 0.95rem 1.15rem;
        justify-content: space-between;
        gap: 1rem;
      }

      :host ::ng-deep .audits-table .p-paginator-current {
        color: #8a7867;
        font-size: 0.82rem;
      }

      :host ::ng-deep .audits-table .p-paginator-pages {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      :host ::ng-deep .audits-table .p-paginator-page,
      :host ::ng-deep .audits-table .p-paginator-prev,
      :host ::ng-deep .audits-table .p-paginator-next,
      :host ::ng-deep .audits-table .p-paginator-first,
      :host ::ng-deep .audits-table .p-paginator-last {
        min-width: 2.5rem;
        height: 2.25rem;
        padding: 0 0.85rem;
        border-radius: 8px;
        border: 1px solid #f0f0f0;
        background: #fff;
        color: #6e5f50;
        box-shadow: none;
      }

      :host ::ng-deep .audits-table .p-paginator-page.p-highlight {
        background: #c8922d;
        border-color: #c8922d;
        color: #fff;
        font-weight: 700;
      }

      :host ::ng-deep .audits-table .p-paginator-page.p-highlight:hover,
      :host ::ng-deep .audits-table .p-paginator-page.p-highlight:focus {
        background: #c8922d;
        border-color: #c8922d;
        color: #fff;
      }

      :host ::ng-deep .audits-table .p-paginator-page:not(.p-highlight):hover,
      :host ::ng-deep .audits-table .p-paginator-prev:hover,
      :host ::ng-deep .audits-table .p-paginator-next:hover,
      :host ::ng-deep .audits-table .p-paginator-first:hover,
      :host ::ng-deep .audits-table .p-paginator-last:hover {
        color: #b8892a;
        border-color: rgba(200, 146, 45, 0.4);
        background: #fff;
      }

      :host ::ng-deep .audits-table .p-paginator-first,
      :host ::ng-deep .audits-table .p-paginator-last {
        min-width: auto;
      }

      :host ::ng-deep .audits-table .p-paginator-first .p-icon,
      :host ::ng-deep .audits-table .p-paginator-last .p-icon {
        display: none;
      }

      :host ::ng-deep .audits-table .p-paginator-first::after {
        content: 'Primera';
      }

      :host ::ng-deep .audits-table .p-paginator-last::after {
        content: 'Última';
      }
    }

    @media (max-width: 900px) {
      .audits-page {
        gap: 1.1rem;
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

      .audits-summary,
      .audits-workbench {
        order: initial;
      }

      .audits-page .summary-grid.audits-summary {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
      }

      .audits-summary-card {
        grid-template-columns: 1fr;
        justify-items: start;
        text-align: left;
        min-height: 0;
        padding: 0.95rem 0.85rem;
        gap: 0.5rem;
      }

      .audits-summary-card__icon {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 0.95rem;
      }

      .audits-summary-card__content span {
        font-size: 0.68rem;
        letter-spacing: 0.07em;
      }

      .audits-summary-card:not(.audits-summary-card--scope) .audits-summary-card__content strong {
        font-size: 1.95rem;
      }

      .audits-summary-card--scope .audits-summary-card__title {
        font-size: 1.12rem !important;
        line-height: 1.25 !important;
        margin-top: 0.35rem !important;
      }

      .audits-summary-card__content small {
        font-size: 0.75rem;
        line-height: 1.35;
      }

      .audit-filter-shell {
        background: rgba(253, 251, 247, 0.92);
        border-radius: 1rem;
        border: 1px solid rgba(214, 191, 152, 0.2);
        margin-inline: 0.35rem;
      }

      .audit-tabs,
      .audit-filter-shell {
        padding-inline: 1rem;
      }

      .audits-active-filters {
        padding-inline: 1rem;
      }

      .audit-tab {
        padding-inline: 0.75rem;
      }

      .audits-filters-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem 0.8rem;
      }

      .audit-filter-shell__actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        width: 100%;
        gap: 0.6rem;
      }

      .audit-filter-shell__actions > * {
        width: 100%;
      }

      .audits-results-head {
        padding: 0.85rem 1rem 0.1rem;
      }

      .audits-results-head h3 {
        font-size: 1.05rem;
      }

      :host ::ng-deep .audits-table .p-datatable-table {
        min-width: 100% !important;
      }

      :host ::ng-deep .audits-table .p-datatable-thead {
        display: none;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody,
      :host ::ng-deep .audits-table .p-datatable-tbody > tr,
      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td {
        display: block;
        width: 100%;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody {
        padding: 0.95rem;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr {
        margin-bottom: 0.95rem;
        padding: 1rem;
        border: 1px solid rgba(214, 191, 152, 0.22);
        border-radius: 1.1rem;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(253, 250, 244, 0.96));
        box-shadow: 0 14px 28px rgba(45, 32, 22, 0.05);
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr:last-child {
        margin-bottom: 0;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td {
        width: auto !important;
        min-width: 0 !important;
        padding: 0 !important;
        border: none !important;
        text-align: left !important;
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.35rem;
        align-items: start;
        white-space: normal;
        overflow-wrap: break-word;
        word-break: normal;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td + td {
        margin-top: 0.8rem;
        padding-top: 0.8rem !important;
        border-top: 1px solid rgba(214, 191, 152, 0.18) !important;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td::before {
        content: '';
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #9a6f14;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td:nth-child(1)::before {
        content: 'Fecha';
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td:nth-child(2)::before {
        content: 'Acción';
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td:nth-child(3)::before {
        content: 'Entidad';
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td:nth-child(4)::before {
        content: 'Usuario';
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td:nth-child(5)::before {
        content: 'Detalle';
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td.audits-td-chevron {
        display: flex !important;
        grid-template-columns: unset !important;
        gap: 0 !important;
        visibility: visible !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: none !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        align-items: center;
        justify-content: flex-end;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td.audits-td-chevron::before {
        display: none !important;
        content: none !important;
      }

      .audits-row-chevron-icon {
        display: grid;
        place-items: center;
        width: 2.1rem;
        height: 2.1rem;
        border-radius: 999px;
        color: #b57b17;
        border: 1px solid rgba(200, 146, 45, 0.28);
        background: rgba(255, 255, 255, 0.9);
        font-size: 0.95rem;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto auto auto auto auto;
        column-gap: 0.65rem;
        row-gap: 0.5rem;
        align-items: start;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td + td {
        margin-top: 0 !important;
        padding-top: 0 !important;
        border-top: none !important;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td:nth-child(1)::before,
      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td:nth-child(2)::before {
        content: none !important;
        display: none !important;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td:nth-child(1) {
        grid-column: 1 / -1;
        grid-row: 1;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td:nth-child(2) {
        grid-column: 1;
        grid-row: 2;
        justify-self: start;
        align-self: center;
        min-width: 0;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td:nth-child(6) {
        grid-column: 2;
        grid-row: 2;
        align-self: center;
        justify-self: end;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td:nth-child(3) {
        grid-column: 1 / -1;
        grid-row: 3;
        padding-top: 0.65rem !important;
        margin-top: 0.35rem !important;
        border-top: 1px solid rgba(214, 191, 152, 0.22) !important;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td:nth-child(4) {
        grid-column: 1 / -1;
        grid-row: 4;
        padding-top: 0.55rem !important;
        border-top: 1px solid rgba(214, 191, 152, 0.16) !important;
      }

      :host ::ng-deep .audits-table .p-datatable-tbody > tr > td:nth-child(5) {
        grid-column: 1 / -1;
        grid-row: 5;
        padding-top: 0.55rem !important;
        border-top: 1px solid rgba(214, 191, 152, 0.16) !important;
      }

      :host ::ng-deep .audits-table .audit-date {
        white-space: normal;
        font-size: 0.82rem;
        line-height: 1.4;
        display: block;
        max-width: 100%;
      }

      :host ::ng-deep .audits-table .audit-action-tag {
        max-width: min(100%, 16rem);
        white-space: normal;
        justify-content: center;
        text-align: center;
        line-height: 1.25;
        font-size: 0.68rem;
        padding: 0.32rem 0.55rem;
      }

      :host ::ng-deep .audits-table .audit-entity strong {
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      :host ::ng-deep .audits-table .audit-detail {
        font-weight: 600;
        color: #5f4a38;
      }

      :host ::ng-deep .audits-table .p-paginator {
        display: grid !important;
        grid-template-columns: repeat(4, auto) !important;
        justify-content: center !important;
        justify-items: center !important;
        align-items: center !important;
        row-gap: 0.55rem !important;
        column-gap: 0.55rem !important;
        padding: 0.95rem 0.9rem 1rem !important;
      }

      :host ::ng-deep .audits-table .p-paginator .p-paginator-rpp-dropdown {
        grid-column: 1 / -1 !important;
        grid-row: 1 !important;
        max-width: 12rem !important;
        margin-inline: auto !important;
      }

      :host ::ng-deep .audits-table .p-paginator .p-select-label {
        text-align: center;
      }

      :host ::ng-deep .audits-table .p-paginator-first,
      :host ::ng-deep .audits-table .p-paginator-prev,
      :host ::ng-deep .audits-table .p-paginator-next,
      :host ::ng-deep .audits-table .p-paginator-last {
        grid-row: 2 !important;
        margin: 0 !important;
      }

      :host ::ng-deep .audits-table .p-paginator-first {
        grid-column: 1 !important;
      }

      :host ::ng-deep .audits-table .p-paginator-prev {
        grid-column: 2 !important;
      }

      :host ::ng-deep .audits-table .p-paginator-next {
        grid-column: 3 !important;
      }

      :host ::ng-deep .audits-table .p-paginator-last {
        grid-column: 4 !important;
      }

      :host ::ng-deep .audits-table .p-paginator-current {
        grid-column: 1 / -1 !important;
        grid-row: 4 !important;
        text-align: center !important;
        margin-top: 0.1rem !important;
      }

      :host ::ng-deep .audits-table .p-paginator-pages {
        grid-column: 1 / -1 !important;
        grid-row: 3 !important;
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
        gap: 0.45rem !important;
        width: 100% !important;
        max-width: max-content !important;
        margin-inline: auto !important;
      }

      :host ::ng-deep .audits-table .p-paginator > *:not(.p-paginator-rpp-dropdown):not(.p-paginator-first):not(.p-paginator-prev):not(.p-paginator-next):not(.p-paginator-last):not(.p-paginator-pages):not(.p-paginator-current) {
        grid-column: 1 / -1 !important;
      }
    }

    @media (max-width: 560px) {
      .audits-page .summary-grid.audits-summary {
        gap: 0.5rem;
      }

      .audits-summary-card {
        padding: 0.75rem 0.65rem;
        gap: 0.45rem;
      }

      .audits-summary-card__icon {
        width: 2.25rem;
        height: 2.25rem;
        font-size: 0.88rem;
      }

      .audit-tabs {
        overflow-x: auto;
        flex-wrap: nowrap;
        scrollbar-width: none;
      }

      .audit-tabs::-webkit-scrollbar {
        display: none;
      }

      .audit-tab {
        flex: 0 0 auto;
      }

      .audit-filter-shell,
      .audits-active-filters {
        padding-inline: 0.9rem;
      }

      .audits-filters-grid {
        grid-template-columns: 1fr;
      }

      .audit-filter-shell__actions {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class AuditsPageComponent implements OnInit {
  private readonly auditApi = inject(AuditApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly currentActionOptions = computed(
    () => AUDIT_ACTION_OPTIONS[this.activeScope()]
  );

  protected readonly scopeMeta = AUDIT_SCOPE_META;
  protected readonly scopes = [
    { value: 'auth', label: AUDIT_SCOPE_META.auth.label },
    { value: 'inventory', label: AUDIT_SCOPE_META.inventory.label },
    { value: 'rooms', label: AUDIT_SCOPE_META.rooms.label }
  ] as const;

  protected readonly activeScope = signal<AuditScope>('auth');
  protected readonly logs = signal<AuditLog[]>([]);
  protected readonly loading = signal(false);

  protected readonly currentScopeLabel = computed(() =>
    this.scopes.find((scope) => scope.value === this.activeScope())?.label ?? ''
  );
  protected readonly currentScopeMeta = computed(() => this.scopeMeta[this.activeScope()]);
  protected readonly uniqueUsers = computed(
    () => new Set(this.logs().map((log) => log.username)).size
  );
  protected readonly uniqueActions = computed(
    () => new Set(this.logs().map((log) => log.action)).size
  );

  protected readonly filtersForm = this.fb.nonNullable.group({
    action: [''],
    username: [''],
    startDate: [''],
    endDate: ['']
  });
  protected readonly filtersValue = toSignal(
    this.filtersForm.valueChanges.pipe(startWith(this.filtersForm.getRawValue())),
    { initialValue: this.filtersForm.getRawValue() }
  );
  protected readonly activeFilterChips = computed(() => {
    const filters = this.filtersValue();
    const chips: string[] = [];
    const action = filters.action?.trim() || '';
    const username = filters.username?.trim() || '';

    if (action) {
      chips.push(`Acción: ${action}`);
    }

    if (username) {
      chips.push(`Usuario: ${username}`);
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

  ngOnInit(): void {
    this.search();
  }

  protected setScope(scope: AuditScope): void {
    this.activeScope.set(scope);
    this.filtersForm.patchValue({ action: '' });
    this.search();
  }

  protected clearFilters(): void {
    this.filtersForm.reset({
      action: '',
      username: '',
      startDate: '',
      endDate: ''
    });
    this.search();
  }

  protected formatMetric(value: number): string {
    return new Intl.NumberFormat('es-CO').format(value);
  }

  protected search(): void {
    this.loading.set(true);
    const scope = this.activeScope();
    const raw = this.filtersForm.getRawValue();
    const filters: AuditFilters = {
      action: raw.action.trim() || null,
      username: raw.username.trim() || null,
      startDate: raw.startDate || null,
      endDate: raw.endDate || null
    };
    const request$ =
      scope === 'auth'
        ? this.auditApi.getAuthAudit(filters)
        : scope === 'inventory'
          ? this.auditApi.getInventoryAudit(filters)
          : this.auditApi.getRoomsAudit(filters);

    request$.pipe(take(1)).subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  protected formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }
}
