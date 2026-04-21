import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuditApiService } from '@core/services/api/audit-api.service';
import type { AuditFilters, AuditLog } from '@models/audit.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

type AuditScope = 'auth' | 'inventory' | 'rooms';

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
    <div class="space-y-8">
      <app-page-header
        eyebrow="Control"
        title="Auditoria"
        subtitle="Consulta eventos y movimientos registrados en el sistema."
      />

      <section class="surface-card space-y-8">
        <div class="section-switcher">
          @for (scope of scopes; track scope.value) {
            <button
              pButton
              type="button"
              [label]="scope.label"
              [severity]="activeScope() === scope.value ? 'primary' : 'secondary'"
              (click)="setScope(scope.value)"
            ></button>
          }
        </div>

        <form [formGroup]="filtersForm" class="filters-grid" (ngSubmit)="search()">
          <label class="field">
            <span>Accion</span>
            <input pInputText type="text" formControlName="action" />
          </label>

          <label class="field">
            <span>Usuario</span>
            <input pInputText type="text" formControlName="username" />
          </label>

          <label class="field">
            <span>Fecha inicial</span>
            <input pInputText type="date" formControlName="startDate" />
          </label>

          <label class="field">
            <span>Fecha final</span>
            <input pInputText type="date" formControlName="endDate" />
          </label>
        </form>

        <div class="app-toolbar">
          <div class="summary-grid flex-1">
            <article class="summary-card">
              <span>Eventos</span>
              <strong>{{ logs().length }}</strong>
              <small>{{ currentScopeLabel() }}</small>
            </article>

            <article class="summary-card">
              <span>Usuarios unicos</span>
              <strong>{{ uniqueUsers() }}</strong>
              <small>Basado en la consulta actual</small>
            </article>

            <article class="summary-card">
              <span>Acciones unicas</span>
              <strong>{{ uniqueActions() }}</strong>
              <small>Segun la consulta actual</small>
            </article>
          </div>

          <div class="app-toolbar__actions">
            <button
              pButton
              type="button"
              icon="pi pi-filter"
              label="Consultar"
              [loading]="loading()"
              (click)="search()"
            ></button>
          </div>
        </div>

        <p-table [value]="logs()" [loading]="loading()" [paginator]="true" [rows]="10" responsiveLayout="scroll">
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
              <td>{{ formatDate(log.createdAt) }}</td>
              <td><p-tag [value]="log.action" severity="info"></p-tag></td>
              <td>{{ log.entityName }}{{ log.entityId !== null ? ' #' + log.entityId : '' }}</td>
              <td>{{ log.username }}</td>
              <td>{{ log.detail || 'Sin detalle' }}</td>
            </tr>
          </ng-template>
        </p-table>
      </section>
    </div>
  `
})
export class AuditsPageComponent implements OnInit {
  private readonly auditApi = inject(AuditApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly scopes = [
    { value: 'auth', label: 'Autenticacion' },
    { value: 'inventory', label: 'Inventario' },
    { value: 'rooms', label: 'Habitaciones' }
  ] as const;

  protected readonly activeScope = signal<AuditScope>('auth');
  protected readonly logs = signal<AuditLog[]>([]);
  protected readonly loading = signal(false);

  protected readonly currentScopeLabel = computed(() =>
    this.scopes.find((scope) => scope.value === this.activeScope())?.label ?? ''
  );
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

  ngOnInit(): void {
    this.search();
  }

  protected setScope(scope: AuditScope): void {
    this.activeScope.set(scope);
    this.search();
  }

  protected search(): void {
    this.loading.set(true);
    const filters = this.filtersForm.getRawValue() as AuditFilters;
    const request$ =
      this.activeScope() === 'auth'
        ? this.auditApi.getAuthAudit(filters)
        : this.activeScope() === 'inventory'
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
