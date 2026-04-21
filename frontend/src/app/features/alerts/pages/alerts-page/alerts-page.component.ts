import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import type { LowStockAlert, SupplyItem } from '@models/inventory.model';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-alerts-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    EmptyStateComponent,
    PageHeaderComponent,
    TableModule,
    TagModule
  ],
  templateUrl: './alerts-page.component.html'
})
export class AlertsPageComponent implements OnInit {
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly lowStockItems = signal<SupplyItem[]>([]);
  protected readonly alerts = signal<LowStockAlert[]>([]);
  protected readonly loading = signal(false);

  protected readonly filtersForm = this.fb.nonNullable.group({
    openOnly: [true]
  });

  protected readonly openAlertsCount = computed(
    () => this.alerts().filter((entry) => !entry.resolvedAt).length
  );

  ngOnInit(): void {
    this.loadData();
  }

  protected loadData(): void {
    this.loading.set(true);
    const openOnly = this.filtersForm.controls.openOnly.getRawValue();

    this.inventoryApi
      .getLowStockItems()
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.lowStockItems.set(items);
          this.inventoryApi
            .getLowStockAlerts(openOnly)
            .pipe(take(1))
            .subscribe({
              next: (alerts) => {
                this.alerts.set(alerts);
                this.loading.set(false);
              },
              error: () => {
                this.loading.set(false);
              }
            });
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  protected formatDate(value: string | null): string {
    return value ? new Date(value).toLocaleString() : 'Pendiente';
  }
}
