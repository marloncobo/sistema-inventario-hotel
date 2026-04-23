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
    label: 'Autenticacion',
    icon: 'pi pi-shield',
    description: 'Eventos de acceso, validacion de sesiones y cambios de seguridad.'
  },
  inventory: {
    label: 'Inventario',
    icon: 'pi pi-box',
    description: 'Trazabilidad de movimientos, ajustes y operaciones sobre existencias.'
  },
  rooms: {
    label: 'Habitaciones',
    icon: 'pi pi-home',
    description: 'Bitacora operativa de entregas, consumos y actividad sobre habitaciones.'
  }
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
    TagModule
  ],
  template: `
    <div class="audits-page">
      <app-page-header
        eyebrow="Control"
        title="Auditoria"
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
            <span>Usuarios unicos</span>
            <strong>{{ formatMetric(uniqueUsers()) }}</strong>
            <small>Basado en la consulta actual</small>
          </div>
        </article>

        <article class="summary-card audits-summary-card">
          <div class="audits-summary-card__icon">
            <i class="pi pi-bolt"></i>
          </div>
          <div class="audits-summary-card__content">
            <span>Acciones unicas</span>
            <strong>{{ formatMetric(uniqueActions()) }}</strong>
            <small>Variedad de eventos registrados</small>
          </div>
        </article>
      </section>

      <section class="surface-card audits-workbench admin-content-block">
        <div class="audit-tabs" role="tablist" aria-label="Alcances de auditoria">
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
          <div class="audit-filter-shell__header">
            <div>
              <h3>Filtros de auditoria</h3>
              <p>Acota por accion, usuario o rango de fechas y vuelve a consultar la bitacora.</p>
            </div>

            <span class="audits-badge">
              <i [class]="currentScopeMeta().icon"></i>
              {{ currentScopeMeta().label }}
            </span>
          </div>

          <div class="filters-grid audits-filters-grid">
            <label class="field">
              <span>Accion</span>
              <input pInputText type="text" formControlName="action" placeholder="LOGIN, CREATE, UPDATE..." />
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

        <div class="audits-result-head">
          <div class="audits-result-head__identity">
            <div class="audits-result-head__icon">
              <i [class]="currentScopeMeta().icon"></i>
            </div>

            <div>
              <h3>{{ currentScopeMeta().label }}</h3>
              <p>{{ currentScopeMeta().description }}</p>
            </div>
          </div>

          <div class="audits-result-head__stats">
            <span>{{ formatMetric(logs().length) }} eventos</span>
            <span>{{ formatMetric(activeFilterCount()) }} filtros</span>
          </div>
        </div>

        <div class="audits-table-wrap admin-table-block">
          @if (!loading() && !logs().length) {
            <div class="audits-empty-state">
              <i class="pi pi-search"></i>
              <strong>Sin eventos para esta consulta</strong>
              <p>Ajusta los filtros o cambia de alcance para revisar otra bitacora.</p>
            </div>
          } @else {
            <p-table
              [value]="logs()"
              [loading]="loading()"
              [paginator]="true"
              [rows]="10"
              [rowsPerPageOptions]="[10, 20, 50]"
              [showCurrentPageReport]="true"
              currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} eventos"
              responsiveLayout="scroll"
              styleClass="audits-table"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>Fecha</th>
                  <th>Accion</th>
                  <th>Entidad</th>
                  <th>Usuario</th>
                  <th>Detalle</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-log>
                <tr>
                  <td><span class="audit-date">{{ formatDate(log.createdAt) }}</span></td>
                  <td><p-tag [value]="log.action" severity="info"></p-tag></td>
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
      max-width: 1360px;
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

    .audit-filter-shell__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .audit-filter-shell__header h3 {
      margin: 0;
      color: #3d2b1f;
      font-size: 1.05rem;
    }

    .audit-filter-shell__header p {
      margin: 0.35rem 0 0;
      color: #8a7867;
      font-size: 0.85rem;
      line-height: 1.5;
    }

    .audits-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.55rem 0.85rem;
      border-radius: 999px;
      background: rgba(200, 146, 45, 0.1);
      color: #a36f16;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      white-space: nowrap;
    }

    .audits-filters-grid {
      gap: 1rem 1.25rem;
    }

    .audit-filter-shell__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: flex-end;
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

    .audits-result-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: linear-gradient(180deg, rgba(253, 251, 247, 0.96), rgba(255, 255, 255, 0.94));
      border-bottom: 1px solid rgba(214, 191, 152, 0.18);
    }

    .audits-result-head__identity {
      display: flex;
      align-items: center;
      gap: 0.95rem;
      min-width: 0;
    }

    .audits-result-head__icon {
      width: 2.9rem;
      height: 2.9rem;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: rgba(200, 146, 45, 0.1);
      color: #c8922d;
      flex-shrink: 0;
    }

    .audits-result-head__identity h3 {
      margin: 0;
      color: #3d2b1f;
      font-size: 1.12rem;
    }

    .audits-result-head__identity p {
      margin: 0.2rem 0 0;
      color: #8a7867;
      font-size: 0.84rem;
      line-height: 1.5;
    }

    .audits-result-head__stats {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.7rem;
    }

    .audits-result-head__stats span {
      display: inline-flex;
      align-items: center;
      padding: 0.45rem 0.72rem;
      border-radius: 999px;
      background: rgba(154, 138, 120, 0.08);
      color: #766553;
      font-size: 0.78rem;
      font-weight: 700;
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

    @media (max-width: 960px) {
      .audit-filter-shell__header,
      .audits-result-head {
        flex-direction: column;
        align-items: stretch;
      }

      .audit-filter-shell__actions,
      .audits-result-head__stats {
        justify-content: flex-start;
      }
    }

    @media (max-width: 720px) {
      .audits-summary-card {
        grid-template-columns: 1fr;
        align-items: flex-start;
      }

      .audit-tabs,
      .audit-filter-shell,
      .audits-result-head {
        padding-inline: 1rem;
      }

      .audits-active-filters {
        padding-inline: 1rem;
      }

      .audit-tab {
        padding-inline: 0.75rem;
      }

      .audit-filter-shell__actions > * {
        width: 100%;
      }
    }
  `
})
export class AuditsPageComponent implements OnInit {
  private readonly auditApi = inject(AuditApiService);
  private readonly fb = inject(FormBuilder);

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
      chips.push(`Accion: ${action}`);
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
