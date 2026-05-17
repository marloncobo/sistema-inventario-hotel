import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { AuthService } from '@core/services/auth.service';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { RoomsApiService } from '@core/services/api/rooms-api.service';
import { ROOM_PAR_SCOPE_OPTIONS } from '@core/constants/domain-options';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiErrorMessage } from '@models/api-error.model';
import type { RoomParComparisonView } from '@models/inventory.model';
import { isHttp403 } from '@shared/utils/http-error.util';
import type { RoomValidationResponse } from '@models/room.model';

@Component({
  selector: 'app-room-lookup-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    RouterLink
  ],
  templateUrl: './room-lookup-page.component.html',
  styleUrls: ['./room-lookup-page.component.css', '../../../../shared/styles/premium-panels.css']
})
export class RoomLookupPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly notificationService = inject(NotificationService);

  protected readonly scopes = ROOM_PAR_SCOPE_OPTIONS;
  protected readonly loading = signal(false);
  protected readonly parLoading = signal(false);
  protected readonly result = signal<RoomValidationResponse | null>(null);
  protected readonly comparison = signal<RoomParComparisonView | null>(null);
  protected readonly lookupError = signal<string | null>(null);
  protected readonly parError = signal<string | null>(null);
  protected readonly submitAttempted = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    number: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]]
  });

  protected readonly parForm = this.fb.nonNullable.group({
    scope: ['HABITACION', Validators.required]
  });

  protected canShowParCompare(): boolean {
    return this.auth.hasRole('RECEPCION');
  }

  protected canGoToAssignments(): boolean {
    return this.auth.hasAnyRole(['ADMIN', 'SERVICIO']);
  }

  ngOnInit(): void {
    this.form.controls.number.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.submitAttempted.set(false);
      this.lookupError.set(null);
      this.comparison.set(null);
      this.parError.set(null);
    });
  }

  protected submitLookup(): void {
    this.lookupError.set(null);
    this.result.set(null);
    this.comparison.set(null);
    this.parError.set(null);

    if (this.form.invalid) {
      this.submitAttempted.set(true);
      this.form.controls.number.markAsTouched();
      return;
    }

    this.submitAttempted.set(false);
    const number = this.form.controls.number.getRawValue().trim();
    this.loading.set(true);
    this.roomsApi
      .getRoomByNumber(number)
      .pipe(take(1))
      .subscribe({
        next: (room) => {
          this.result.set(room);
          this.loading.set(false);
          if (this.canShowParCompare()) {
            this.loadParComparison(number);
          }
        },
        error: (error) => {
          this.loading.set(false);
          if (isHttp403(error)) {
            this.lookupError.set('No tienes permiso para consultar habitaciones.');
            return;
          }
          const message = extractApiErrorMessage(
            error instanceof HttpErrorResponse ? error.error : undefined
          );
          this.lookupError.set(message);
        }
      });
  }

  protected comparePar(): void {
    const number = this.form.controls.number.getRawValue().trim();
    if (!/^\d{3}$/.test(number)) {
      return;
    }
    this.loadParComparison(number);
  }

  protected labelScope(value: string): string {
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  protected statusClass(status: string): string {
    if (status === 'FALTA') return 'par-status--short';
    if (status === 'SOBRA') return 'par-status--surplus';
    return 'par-status--ok';
  }

  private loadParComparison(roomNumber: string): void {
    const scope = this.parForm.controls.scope.getRawValue();
    this.parLoading.set(true);
    this.parError.set(null);
    this.inventoryApi
      .compareRoomPar(roomNumber, scope)
      .pipe(take(1))
      .subscribe({
        next: (view) => {
          this.comparison.set(view);
          this.parLoading.set(false);
        },
        error: (error) => {
          this.comparison.set(null);
          this.parLoading.set(false);
          if (isHttp403(error)) {
            this.parError.set(
              'No se pudo comparar el PAR. Si el problema continúa, contacta al administrador.'
            );
            return;
          }
          this.parError.set(
            extractApiErrorMessage(error instanceof HttpErrorResponse ? error.error : undefined)
          );
        }
      });
  }

  protected showNumberError(): boolean {
    const c = this.form.controls.number;
    return this.submitAttempted() && c.invalid;
  }

  protected numberError(): string {
    const errors = this.form.controls.number.errors;
    if (!errors) {
      return '';
    }
    if (errors['required']) {
      return 'Indica el número de habitación.';
    }
    if (errors['pattern']) {
      return 'Usa tres dígitos, por ejemplo 204.';
    }
    return 'Valor no válido.';
  }
}
