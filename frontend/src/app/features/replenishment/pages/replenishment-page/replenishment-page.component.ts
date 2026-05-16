import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { ROOM_PAR_SCOPE_OPTIONS } from '@core/constants/domain-options';
import type { ReplenishmentSuggestion } from '@models/inventory.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-replenishment-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, TableModule, PageHeaderComponent],
  templateUrl: './replenishment-page.component.html',
  styleUrls: ['./replenishment-page.component.css']
})
export class ReplenishmentPageComponent implements OnInit {
  private readonly api = inject(InventoryApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly scopes = ROOM_PAR_SCOPE_OPTIONS;
  protected readonly suggestions = signal<ReplenishmentSuggestion[]>([]);
  protected readonly loading = signal(false);

  protected readonly filterForm = this.fb.nonNullable.group({
    roomNumber: [''],
    scope: ['HABITACION']
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    const raw = this.filterForm.getRawValue();
    this.api
      .getReplenishmentSuggestions({
        roomNumber: raw.roomNumber.trim() || null,
        scope: raw.scope || null
      })
      .pipe(take(1))
      .subscribe({
        next: (list) => {
          this.suggestions.set(list);
          this.loading.set(false);
        },
        error: () => {
          this.suggestions.set([]);
          this.loading.set(false);
        }
      });
  }

  protected priorityClass(p: string): string {
    if (p === 'ALTA') return 'rep-priority--high';
    if (p === 'SIN_STOCK_BODEGA') return 'rep-priority--none';
    return 'rep-priority--med';
  }
}
