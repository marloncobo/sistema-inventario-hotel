import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { AuthService } from '@core/services/auth.service';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import { ROOM_PAR_SCOPE_OPTIONS, ROOM_TYPES } from '@core/constants/domain-options';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiErrorMessage, extractApiFieldErrors } from '@models/api-error.model';
import type {
  CreateRoomParRequest,
  RoomPar,
  RoomParComparisonView,
  RoomParLine,
  RoomParLineRequest,
  UpdateRoomParRequest
} from '@models/inventory.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { notBlankValidator } from '@shared/utils/app-validators.util';
import { applyServerValidationErrors } from '@shared/utils/form-errors.util';
import { isHttp403 } from '@shared/utils/http-error.util';

@Component({
  selector: 'app-par-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TableModule,
    PageHeaderComponent
  ],
  templateUrl: './par-page.component.html',
  styleUrls: ['./par-page.component.css']
})
export class ParPageComponent implements OnInit {
  private readonly api = inject(InventoryApiService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly roomTypes = ROOM_TYPES;
  protected readonly scopes = ROOM_PAR_SCOPE_OPTIONS;
  protected readonly pars = signal<RoomPar[]>([]);
  protected readonly comparison = signal<RoomParComparisonView | null>(null);
  protected readonly items = signal<{ id: number; code: string; name: string }[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly submitError = signal<string | null>(null);

  protected readonly compareForm = this.fb.nonNullable.group({
    roomNumber: ['101', [Validators.required, Validators.pattern(/^\d{3}$/)]],
    scope: ['HABITACION', Validators.required]
  });

  protected readonly parForm = this.fb.nonNullable.group({
    roomType: ['ESTANDAR', Validators.required],
    scope: ['HABITACION', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(120), notBlankValidator]],
    active: [true],
    lines: this.fb.array([this.createLineGroup()])
  });

  ngOnInit(): void {
    if (this.canManage()) {
      this.loadPars();
      this.api
        .getItems()
        .pipe(take(1))
        .subscribe((list) =>
          this.items.set(list.filter((i) => i.active).map((i) => ({ id: i.id, code: i.code, name: i.name })))
        );
    }
  }

  protected get lineControls(): FormArray {
    return this.parForm.controls.lines;
  }

  protected canManage(): boolean {
    return this.auth.hasAnyRole(['ADMIN', 'ALMACENISTA']);
  }

  protected canCompareOnly(): boolean {
    return this.auth.hasRole('RECEPCION');
  }

  protected loadPars(): void {
    if (!this.canManage()) {
      return;
    }
    this.api
      .getRoomPars(false, { auxiliary: true })
      .pipe(take(1))
      .subscribe({
        next: (list) => this.pars.set(list),
        error: () => this.pars.set([])
      });
  }

  protected compare(): void {
    if (this.compareForm.invalid) {
      this.compareForm.markAllAsTouched();
      return;
    }
    const raw = this.compareForm.getRawValue();
    this.loading.set(true);
    this.api
      .compareRoomPar(raw.roomNumber, raw.scope)
      .pipe(take(1))
      .subscribe({
        next: (view) => {
          this.comparison.set(view);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          if (!isHttp403(error)) {
            this.notify.error('PAR', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected openCreate(): void {
    if (!this.canManage()) {
      return;
    }
    this.editingId.set(null);
    this.submitError.set(null);
    this.parForm.reset({
      roomType: 'ESTANDAR',
      scope: 'HABITACION',
      name: '',
      active: true
    });
    this.lineControls.clear();
    this.lineControls.push(this.createLineGroup());
    this.parForm.controls.roomType.enable();
    this.parForm.controls.scope.enable();
    this.dialogVisible.set(true);
  }

  protected openEdit(par: RoomPar): void {
    if (!this.canManage()) {
      return;
    }
    this.editingId.set(par.id);
    this.submitError.set(null);
    this.saving.set(true);
    this.api
      .getRoomPar(par.id)
      .pipe(take(1))
      .subscribe({
        next: (full) => {
          this.saving.set(false);
          this.parForm.reset({
            roomType: full.roomType,
            scope: full.scope,
            name: full.name,
            active: full.active
          });
          this.parForm.controls.roomType.disable();
          this.parForm.controls.scope.disable();
          this.lineControls.clear();
          const lines = full.lines?.length ? full.lines : [];
          if (lines.length === 0) {
            this.lineControls.push(this.createLineGroup());
          } else {
            for (const line of lines) {
              this.lineControls.push(this.createLineGroup(line));
            }
          }
          this.dialogVisible.set(true);
        },
        error: (error) => {
          this.saving.set(false);
          if (!isHttp403(error)) {
            this.notify.error('PAR', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected addLine(): void {
    this.lineControls.push(this.createLineGroup());
  }

  protected removeLine(index: number): void {
    if (this.lineControls.length > 1) {
      this.lineControls.removeAt(index);
    }
  }

  protected submitPar(): void {
    if (!this.canManage() || this.parForm.invalid) {
      this.parForm.markAllAsTouched();
      return;
    }

    const raw = this.parForm.getRawValue();
    const lines = this.buildLinePayload();
    if (!lines.length) {
      this.submitError.set('Agrega al menos una línea al PAR.');
      return;
    }

    this.saving.set(true);
    this.submitError.set(null);
    const editingId = this.editingId();

    const request$ =
      editingId === null
        ? this.api.createRoomPar({
            roomType: raw.roomType,
            scope: raw.scope,
            name: raw.name.trim(),
            active: raw.active,
            lines
          } satisfies CreateRoomParRequest)
        : this.api.updateRoomPar(editingId, {
            name: raw.name.trim(),
            active: raw.active,
            lines
          } satisfies UpdateRoomParRequest);

    request$.pipe(take(1)).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success('PAR', editingId === null ? 'Plantilla PAR creada.' : 'Plantilla PAR actualizada.');
        this.loadPars();
      },
      error: (error) => {
        this.saving.set(false);
        if (isHttp403(error)) {
          return;
        }
        const fieldErrors = extractApiFieldErrors(error.error);
        if (Object.keys(fieldErrors).length) {
          applyServerValidationErrors(this.parForm, fieldErrors);
          return;
        }
        this.submitError.set(extractApiErrorMessage(error.error));
      }
    });
  }

  protected label(value: string): string {
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  protected statusClass(status: string): string {
    if (status === 'FALTA') return 'par-status--short';
    if (status === 'SOBRA') return 'par-status--surplus';
    return 'par-status--ok';
  }

  private createLineGroup(line?: RoomParLine): FormGroup {
    return this.fb.nonNullable.group({
      itemId: [line ? String(line.itemId) : '', Validators.required],
      targetQuantity: [line?.targetQuantity ?? 1, [Validators.required, Validators.min(0)]],
      mandatory: [line?.mandatory ?? true],
      notes: [line?.notes ?? '', Validators.maxLength(300)]
    });
  }

  private buildLinePayload(): RoomParLineRequest[] {
    return this.lineControls.controls.map((group) => {
      const value = group.getRawValue();
      return {
        itemId: Number(value.itemId),
        targetQuantity: Number(value.targetQuantity),
        mandatory: value.mandatory,
        notes: value.notes?.trim() ? value.notes.trim() : null
      };
    });
  }
}
