import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { AuthService } from '@core/services/auth.service';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiErrorMessage } from '@models/api-error.model';
import { isHttp403 } from '@shared/utils/http-error.util';
import type { InventoryDocument } from '@models/inventory.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-variances-page',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, PageHeaderComponent],
  templateUrl: './variances-page.component.html',
  styleUrls: ['./variances-page.component.css']
})
export class VariancesPageComponent implements OnInit {
  private readonly api = inject(InventoryApiService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  protected readonly pending = signal<InventoryDocument[]>([]);
  protected readonly approved = signal<InventoryDocument[]>([]);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  protected isAdmin(): boolean {
    return this.auth.hasRole('ADMIN');
  }

  protected load(): void {
    this.loading.set(true);
    this.api
      .getDocuments({ type: 'CONTEO' })
      .pipe(take(1))
      .subscribe({
        next: (docs) => {
          this.pending.set(docs.filter((d) => d.status === 'PENDIENTE_APROBACION'));
          this.approved.set(docs.filter((d) => d.status === 'APROBADO'));
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          if (!isHttp403(error)) {
            this.notify.error('Diferencias', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected approve(doc: InventoryDocument): void {
    this.api
      .approveVariance(doc.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.notify.success('Diferencias', 'Conteo aprobado.');
          this.load();
        },
        error: (error) => {
          if (!isHttp403(error)) {
            this.notify.error('Diferencias', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected apply(doc: InventoryDocument): void {
    this.api
      .applyVariance(doc.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.notify.success('Diferencias', 'Ajustes aplicados al inventario.');
          this.load();
        },
        error: (error) => {
          if (!isHttp403(error)) {
            this.notify.error('Diferencias', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected varianceSummary(doc: InventoryDocument): string {
    return doc.lines
      .map((l) => {
        const exp = l.quantityExpected ?? 0;
        const act = l.quantityActual ?? exp;
        return `${l.itemName}: ${act - exp}`;
      })
      .join(' · ');
  }
}
