import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RoomsApiService } from '@core/services/api/rooms-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiErrorMessage } from '@models/api-error.model';
import type { RoomValidationResponse } from '@models/room.model';

@Component({
  selector: 'app-room-lookup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, RouterLink],
  templateUrl: './room-lookup-page.component.html',
  styleUrls: ['./room-lookup-page.component.css', '../../../../shared/styles/premium-panels.css']
})
export class RoomLookupPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly notificationService = inject(NotificationService);

  protected readonly loading = signal(false);
  protected readonly result = signal<RoomValidationResponse | null>(null);
  protected readonly lookupError = signal<string | null>(null);
  protected readonly submitAttempted = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    number: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]]
  });

  ngOnInit(): void {
    this.form.controls.number.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.submitAttempted.set(false);
      this.lookupError.set(null);
    });
  }

  protected submitLookup(): void {
    this.lookupError.set(null);
    this.result.set(null);

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
        },
        error: (error) => {
          this.loading.set(false);
          const message = extractApiErrorMessage(error?.error);
          this.lookupError.set(message);
          this.notificationService.warn('Habitaciones', message);
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
