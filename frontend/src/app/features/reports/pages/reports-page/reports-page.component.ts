import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Observable, startWith, take } from 'rxjs';
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

const REPORT_META: Record<
  ReportKey,
  {
    label: string;
    icon: string;
    description: string;
    totalLabel: string;
    totalNote: string;
  }
> = {
  inventory: {
    label: 'Resumen inventario',
    icon: 'pi pi-box',
    description: 'Consolida stock, rotacion y umbrales operativos del inventario actual.',
    totalLabel: 'Stock acumulado',
    totalNote: 'Suma del stock visible en la consulta'
  },
  'top-used': {
    label: 'Mas usados',
    icon: 'pi pi-chart-line',
    description: 'Muestra los insumos con mayor salida durante el periodo consultado.',
    totalLabel: 'Unidades usadas',
    totalNote: 'Suma de cantidades reportadas'
  },
  consumption: {
    label: 'Consumo habitaciones',
    icon: 'pi pi-home',
    description: 'Detalle de consumo por habitacion, tipo y asignacion operativa.',
    totalLabel: 'Total consumido',
    totalNote: 'Cantidad consolidada del reporte'
  },
  distribution: {
    label: 'Distribucion habitaciones',
    icon: 'pi pi-send',
    description: 'Seguimiento de entregas, responsables y huespedes asociados.',
    totalLabel: 'Total distribuido',
    totalNote: 'Cantidad visible para la consulta'
  }
};

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
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.css']
})
export class ReportsPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly downloadService = inject(FileDownloadService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly exportFormats = EXPORT_FORMAT_OPTIONS;
  protected readonly reportMeta = REPORT_META;
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
  protected readonly filtersValue = toSignal(
    this.filtersForm.valueChanges.pipe(startWith(this.filtersForm.getRawValue())),
    { initialValue: this.filtersForm.getRawValue() }
  );

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

  protected readonly currentReportMeta = computed(() => this.reportMeta[this.activeReport()]);

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

  protected readonly activeFilterChips = computed(() => {
    const filters = this.filtersValue();
    const chips: string[] = [];
    const roomNumber = filters.roomNumber?.trim() || '';
    const roomType = filters.roomType?.trim() || '';
    const assignmentType = filters.assignmentType?.trim() || '';
    const deliveredBy = filters.deliveredBy?.trim() || '';

    if (filters.startDate) {
      chips.push(`Desde: ${filters.startDate}`);
    }

    if (filters.endDate) {
      chips.push(`Hasta: ${filters.endDate}`);
    }

    if (this.activeReport() === 'consumption' || this.activeReport() === 'distribution') {
      if (roomNumber) {
        chips.push(`Habitacion: ${roomNumber}`);
      }

      if (roomType) {
        chips.push(`Tipo: ${roomType}`);
      }

      if (assignmentType) {
        chips.push(`Asignacion: ${assignmentType}`);
      }
    }

    if (this.activeReport() === 'distribution' && deliveredBy) {
      chips.push(`Responsable: ${deliveredBy}`);
    }

    return chips;
  });

  protected readonly activeFilterCount = computed(() => this.activeFilterChips().length);

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

  protected clearFilters(): void {
    this.filtersForm.reset({
      startDate: '',
      endDate: '',
      roomNumber: '',
      roomType: '',
      assignmentType: '',
      deliveredBy: ''
    });
  }

  protected formatMetric(value: number): string {
    return new Intl.NumberFormat('es-CO').format(value);
  }

  protected loadReport(): void {
    this.loading.set(true);
    const report = this.activeReport();
    const filters = this.filtersForm.getRawValue();

    const request$: Observable<
      InventorySummaryReport[] | TopUsedItemReport[] | RoomConsumptionReport[] | RoomDistributionReport[]
    > =
      report === 'inventory'
        ? this.inventoryApi.getInventoryReport({
            startDate: filters.startDate || null,
            endDate: filters.endDate || null
          })
        : report === 'top-used'
          ? this.inventoryApi.getTopUsedReport({
              startDate: filters.startDate || null,
              endDate: filters.endDate || null
            })
          : report === 'consumption'
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
        if (report === 'inventory') {
          this.inventoryReport.set(result as InventorySummaryReport[]);
        } else if (report === 'top-used') {
          this.topUsedReport.set(result as TopUsedItemReport[]);
        } else if (report === 'consumption') {
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
    const report = this.activeReport();
    const filters = this.filtersForm.getRawValue();
    const request$ =
      report === 'inventory'
        ? this.inventoryApi.exportInventoryReport(format, {
            startDate: filters.startDate || null,
            endDate: filters.endDate || null
          })
        : report === 'top-used'
          ? this.inventoryApi.exportTopUsedReport(format, {
              startDate: filters.startDate || null,
              endDate: filters.endDate || null
            })
          : report === 'consumption'
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
        this.downloadService.downloadFromResponse(response, `reporte-${report}.${format}`);
        this.exporting.set(false);
        this.notificationService.success('Reportes', `Exportacion ${format.toUpperCase()} generada.`);
      },
      error: () => {
        this.exporting.set(false);
      }
    });
  }
}
