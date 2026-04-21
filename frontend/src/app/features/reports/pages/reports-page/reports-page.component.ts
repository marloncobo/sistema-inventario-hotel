import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Observable, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { EXPORT_FORMAT_OPTIONS } from '@core/constants/domain-options';
import { AuthService } from '@core/services/auth.service';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { RoomsApiService } from '@core/services/api/rooms-api.service';
import { FileDownloadService } from '@core/services/ui/file-download.service';
import { NotificationService } from '@core/services/ui/notification.service';
import type { InventorySummaryReport, TopUsedItemReport } from '@models/inventory.model';
import type { RoomConsumptionReport, RoomDistributionReport } from '@models/room.model';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

type ReportKey = 'inventory' | 'top-used' | 'consumption' | 'distribution';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    EmptyStateComponent,
    PageHeaderComponent,
    TableModule,
    TagModule
  ],
  templateUrl: './reports-page.component.html'
})
export class ReportsPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly downloadService = inject(FileDownloadService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly exportFormats = EXPORT_FORMAT_OPTIONS;
  protected readonly inventoryReport = signal<InventorySummaryReport[]>([]);
  protected readonly topUsedReport = signal<TopUsedItemReport[]>([]);
  protected readonly consumptionReport = signal<RoomConsumptionReport[]>([]);
  protected readonly distributionReport = signal<RoomDistributionReport[]>([]);
  protected readonly activeReport = signal<ReportKey>('inventory');
  protected readonly loading = signal(false);
  protected readonly exporting = signal(false);

  protected readonly filtersForm = this.fb.nonNullable.group({
    startDate: [''],
    endDate: [''],
    roomNumber: [''],
    roomType: [''],
    assignmentType: [''],
    deliveredBy: ['']
  });

  protected readonly availableReports = computed(() => {
    const reports: Array<{ key: ReportKey; label: string }> = [
      { key: 'consumption', label: 'Consumo habitaciones' },
      { key: 'distribution', label: 'Distribucion habitaciones' }
    ];

    if (this.authService.hasRole('ADMIN')) {
      reports.unshift(
        { key: 'inventory', label: 'Resumen inventario' },
        { key: 'top-used', label: 'Mas usados' }
      );
    }

    return reports;
  });

  protected readonly currentCount = computed(() => {
    switch (this.activeReport()) {
      case 'inventory':
        return this.inventoryReport().length;
      case 'top-used':
        return this.topUsedReport().length;
      case 'consumption':
        return this.consumptionReport().length;
      default:
        return this.distributionReport().length;
    }
  });

  protected readonly currentQuantity = computed(() => {
    switch (this.activeReport()) {
      case 'inventory':
        return this.inventoryReport().reduce((sum, row) => sum + row.currentStock, 0);
      case 'top-used':
        return this.topUsedReport().reduce((sum, row) => sum + row.totalQuantity, 0);
      case 'consumption':
        return this.consumptionReport().reduce((sum, row) => sum + row.totalQuantity, 0);
      default:
        return this.distributionReport().reduce((sum, row) => sum + row.quantity, 0);
    }
  });

  ngOnInit(): void {
    this.activeReport.set(this.availableReports()[0]?.key ?? 'consumption');
    this.loadReport();
  }

  protected isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  protected setReport(report: ReportKey): void {
    this.activeReport.set(report);
    this.loadReport();
  }

  protected loadReport(): void {
    this.loading.set(true);
    const filters = this.filtersForm.getRawValue();

    const request$: Observable<
      InventorySummaryReport[] | TopUsedItemReport[] | RoomConsumptionReport[] | RoomDistributionReport[]
    > =
      this.activeReport() === 'inventory'
        ? this.inventoryApi.getInventoryReport({
            startDate: filters.startDate || null,
            endDate: filters.endDate || null
          })
        : this.activeReport() === 'top-used'
          ? this.inventoryApi.getTopUsedReport({
              startDate: filters.startDate || null,
              endDate: filters.endDate || null
            })
          : this.activeReport() === 'consumption'
            ? this.roomsApi.getConsumptionReport({
                roomNumber: filters.roomNumber.trim() || null,
                roomType: filters.roomType.trim() || null,
                assignmentType: filters.assignmentType.trim() || null,
                startDate: filters.startDate || null,
                endDate: filters.endDate || null
              })
            : this.roomsApi.getDistributionReport({
                roomNumber: filters.roomNumber.trim() || null,
                roomType: filters.roomType.trim() || null,
                assignmentType: filters.assignmentType.trim() || null,
                deliveredBy: filters.deliveredBy.trim() || null,
                startDate: filters.startDate || null,
                endDate: filters.endDate || null
              });

    request$.pipe(take(1)).subscribe({
      next: (
        result:
          | InventorySummaryReport[]
          | TopUsedItemReport[]
          | RoomConsumptionReport[]
          | RoomDistributionReport[]
      ) => {
        if (this.activeReport() === 'inventory') {
          this.inventoryReport.set(result as InventorySummaryReport[]);
        } else if (this.activeReport() === 'top-used') {
          this.topUsedReport.set(result as TopUsedItemReport[]);
        } else if (this.activeReport() === 'consumption') {
          this.consumptionReport.set(result as RoomConsumptionReport[]);
        } else {
          this.distributionReport.set(result as RoomDistributionReport[]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  protected canExport(): boolean {
    return this.isAdmin();
  }

  protected exportReport(format: 'xlsx' | 'csv' | 'pdf'): void {
    if (!this.canExport()) {
      return;
    }

    this.exporting.set(true);
    const filters = this.filtersForm.getRawValue();
    const request$ =
      this.activeReport() === 'inventory'
        ? this.inventoryApi.exportInventoryReport(format, {
            startDate: filters.startDate || null,
            endDate: filters.endDate || null
          })
        : this.activeReport() === 'top-used'
          ? this.inventoryApi.exportTopUsedReport(format, {
              startDate: filters.startDate || null,
              endDate: filters.endDate || null
            })
          : this.activeReport() === 'consumption'
            ? this.roomsApi.exportConsumptionReport(format, {
                roomNumber: filters.roomNumber.trim() || null,
                roomType: filters.roomType.trim() || null,
                assignmentType: filters.assignmentType.trim() || null,
                startDate: filters.startDate || null,
                endDate: filters.endDate || null
              })
            : this.roomsApi.exportDistributionReport(format, {
                roomNumber: filters.roomNumber.trim() || null,
                roomType: filters.roomType.trim() || null,
                assignmentType: filters.assignmentType.trim() || null,
                deliveredBy: filters.deliveredBy.trim() || null,
                startDate: filters.startDate || null,
                endDate: filters.endDate || null
              });

    request$.pipe(take(1)).subscribe({
      next: (response) => {
        this.downloadService.downloadFromResponse(response, `reporte-${this.activeReport()}.${format}`);
        this.exporting.set(false);
        this.notificationService.success('Reportes', `Exportacion ${format.toUpperCase()} generada.`);
      },
      error: () => {
        this.exporting.set(false);
      }
    });
  }
}
