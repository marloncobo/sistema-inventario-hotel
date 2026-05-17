import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiErrorMessage } from '@models/api-error.model';
import type { InventoryDocument, Location } from '@models/inventory.model';
import { isHttp403 } from '@shared/utils/http-error.util';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-counts-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, TableModule, PageHeaderComponent],
  templateUrl: './counts-page.component.html',
  styleUrls: ['./counts-page.component.css']
})
export class CountsPageComponent implements OnInit {
  private readonly api = inject(InventoryApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly locations = signal<Location[]>([]);
  protected readonly activeCount = signal<InventoryDocument | null>(null);
  protected readonly countLines = signal<{ lineId: number; itemName: string; systemQty: number; actual: number }[]>([]);
  protected readonly loading = signal(false);

  protected readonly initForm = this.fb.nonNullable.group({
    locationId: ['', Validators.required],
    notes: ['']
  });

  ngOnInit(): void {
    this.api
      .getLocations({ activeOnly: true })
      .pipe(take(1))
      .subscribe({
        next: (l) => this.locations.set(l),
        error: (error) => {
          this.locations.set([]);
          if (!isHttp403(error)) {
            this.notify.error('Conteos', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected startCount(): void {
    if (this.initForm.invalid) {
      this.initForm.markAllAsTouched();
      return;
    }
    const raw = this.initForm.getRawValue();
    this.loading.set(true);
    this.api
      .initCount({ locationId: Number(raw.locationId), notes: raw.notes.trim() || null })
      .pipe(take(1))
      .subscribe({
        next: (doc) => {
          this.activeCount.set(doc);
          this.countLines.set(
            doc.lines.map((l) => ({
              lineId: l.id,
              itemName: l.itemName,
              systemQty: l.quantityExpected,
              actual: l.quantityActual ?? l.quantityExpected
            }))
          );
          this.loading.set(false);
          this.notify.success('Conteo', 'Documento ' + doc.code + ' creado.');
        },
        error: (error) => {
          this.loading.set(false);
          if (!isHttp403(error)) {
            this.notify.error('Conteo', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected updateActual(index: number, value: string): void {
    this.countLines.update((lines) => {
      const copy = [...lines];
      copy[index] = { ...copy[index], actual: Number(value) };
      return copy;
    });
  }

  protected saveAndClose(): void {
    const doc = this.activeCount();
    if (!doc) return;
    this.loading.set(true);
    this.api
      .recordCount(doc.id, {
        lines: this.countLines().map((l) => ({ lineId: l.lineId, quantityActual: l.actual })),
        notes: 'Conteo físico registrado'
      })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.api
            .completeCount(doc.id)
            .pipe(take(1))
            .subscribe({
              next: (closed) => {
                this.loading.set(false);
                this.activeCount.set(closed);
                const msg =
                  closed.status === 'PENDIENTE_APROBACION'
                    ? 'Hay diferencias: requiere aprobación en Diferencias.'
                    : 'Conteo aplicado sin diferencias.';
                this.notify.success('Conteo', msg);
              },
              error: (error) => {
                this.loading.set(false);
                if (!isHttp403(error)) {
                  this.notify.error('Conteo', extractApiErrorMessage(error.error));
                }
              }
            });
        },
        error: (error) => {
          this.loading.set(false);
          if (!isHttp403(error)) {
            this.notify.error('Conteo', extractApiErrorMessage(error.error));
          }
        }
      });
  }
}
