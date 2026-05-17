import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { AuthService } from '@core/services/auth.service';
import { InventoryApiService } from '@core/services/api/inventory-api.service';
import {
  DOCUMENT_STATUS_OPTIONS,
  DOCUMENT_TYPE_OPTIONS
} from '@core/constants/domain-options';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiErrorMessage } from '@models/api-error.model';
import type {
  CreateDocumentRequest,
  InventoryDocument,
  Location,
  ReceiveDocumentRequest,
  SupplyItem
} from '@models/inventory.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { isHttp403 } from '@shared/utils/http-error.util';

@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PageHeaderComponent,
    TableModule
  ],
  templateUrl: './documents-page.component.html',
  styleUrls: ['./documents-page.component.css']
})
export class DocumentsPageComponent implements OnInit {
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly documentTypes = DOCUMENT_TYPE_OPTIONS;
  protected readonly documentStatuses = DOCUMENT_STATUS_OPTIONS;
  protected readonly documents = signal<InventoryDocument[]>([]);
  protected readonly items = signal<SupplyItem[]>([]);
  protected readonly locations = signal<Location[]>([]);
  protected readonly providers = signal<string[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly createDialogVisible = signal(false);
  protected readonly detailDialogVisible = signal(false);
  protected readonly receiveDialogVisible = signal(false);
  protected readonly selectedDocument = signal<InventoryDocument | null>(null);
  protected readonly submitError = signal<string | null>(null);
  protected readonly typeFilter = signal('');
  protected readonly statusFilter = signal('');

  protected readonly createForm = this.fb.nonNullable.group({
    type: ['ORDEN_COMPRA', Validators.required],
    providerName: [''],
    fromLocationId: [''],
    toLocationId: [''],
    notes: [''],
    lines: this.fb.array([this.createLineGroup()])
  });

  protected readonly receiveForm = this.fb.group({
    toLocationId: [''],
    notes: [''],
    lines: this.fb.array<ReturnType<typeof this.createReceiveLineGroup>>([])
  });

  protected readonly filteredDocuments = computed(() => {
    const type = this.typeFilter().trim().toUpperCase();
    const status = this.statusFilter().trim().toUpperCase();
    return this.documents().filter((doc) => {
      if (type && doc.type !== type) return false;
      if (status && doc.status !== status) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.loadDocuments();
    this.loadReferenceData();
  }

  protected get lines(): FormArray {
    return this.createForm.controls.lines;
  }

  protected get receiveLines(): FormArray {
    return this.receiveForm.controls.lines;
  }

  protected isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  protected loadDocuments(): void {
    this.loading.set(true);
    this.inventoryApi
      .getDocuments()
      .pipe(take(1))
      .subscribe({
        next: (docs) => {
          this.documents.set(docs);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          if (!isHttp403(error)) {
            this.notificationService.error('Documentos', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected loadReferenceData(): void {
    this.inventoryApi.getItems().pipe(take(1)).subscribe({
      next: (items) => this.items.set(items.filter((i) => i.active))
    });
    this.inventoryApi.getLocations({ activeOnly: true }).pipe(take(1)).subscribe({
      next: (locations) => this.locations.set(locations)
    });
    this.inventoryApi.getProviders().pipe(take(1)).subscribe({
      next: (providers) => this.providers.set(providers.map((p) => p.name))
    });
  }

  protected openCreate(): void {
    this.submitError.set(null);
    this.createForm.reset({
      type: 'ORDEN_COMPRA',
      providerName: '',
      fromLocationId: '',
      toLocationId: '',
      notes: ''
    });
    this.lines.clear();
    this.lines.push(this.createLineGroup());
    this.createDialogVisible.set(true);
  }

  protected addLine(): void {
    this.lines.push(this.createLineGroup());
  }

  protected removeLine(index: number): void {
    if (this.lines.length > 1) {
      this.lines.removeAt(index);
    }
  }

  protected submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const raw = this.createForm.getRawValue();
    const type = raw.type;
    const payload: CreateDocumentRequest = {
      type,
      providerName: raw.providerName.trim() || null,
      fromLocationId: raw.fromLocationId ? Number(raw.fromLocationId) : null,
      toLocationId: raw.toLocationId ? Number(raw.toLocationId) : null,
      notes: raw.notes.trim() || null,
      lines: raw.lines.map((line) => ({
        itemId: Number(line.itemId),
        quantityExpected: Number(line.quantityExpected),
        unitCost: line.unitCost ? Number(line.unitCost) : null,
        notes: line.notes.trim() || null
      }))
    };

    this.saving.set(true);
    this.inventoryApi
      .createDocument(payload)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.createDialogVisible.set(false);
          this.notificationService.success('Documentos', 'Documento creado en borrador.');
          this.loadDocuments();
        },
        error: (error) => {
          this.saving.set(false);
          if (!isHttp403(error)) {
            this.submitError.set(extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected openDetail(doc: InventoryDocument): void {
    this.inventoryApi
      .getDocument(doc.id)
      .pipe(take(1))
      .subscribe({
        next: (detail) => {
          this.selectedDocument.set(detail);
          this.detailDialogVisible.set(true);
        }
      });
  }

  protected approve(doc: InventoryDocument): void {
    this.inventoryApi
      .approveDocument(doc.id)
      .pipe(take(1))
      .subscribe({
        next: (updated) => {
          this.notificationService.success('Documentos', 'Orden aprobada.');
          this.refreshDocument(updated);
        },
        error: (error) => {
          if (!isHttp403(error)) {
            this.notificationService.error('Documentos', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected openReceive(doc: InventoryDocument): void {
    this.inventoryApi
      .getDocument(doc.id)
      .pipe(take(1))
      .subscribe({
        next: (detail) => {
          this.selectedDocument.set(detail);
          this.receiveLines.clear();
          for (const line of detail.lines) {
            this.receiveLines.push(
              this.createReceiveLineGroup(line.id, line.quantityExpected, line.unitCost)
            );
          }
          const bodega = this.locations().find((l) => l.code === 'BODEGA_PRINCIPAL');
          this.receiveForm.reset({
            toLocationId: detail.toLocationId ? String(detail.toLocationId) : bodega ? String(bodega.id) : '',
            notes: ''
          });
          this.receiveDialogVisible.set(true);
        }
      });
  }

  protected submitReceive(): void {
    const doc = this.selectedDocument();
    if (!doc || this.receiveForm.invalid) {
      this.receiveForm.markAllAsTouched();
      return;
    }
    const raw = this.receiveForm.getRawValue();
    const payload: ReceiveDocumentRequest = {
      toLocationId: raw.toLocationId ? Number(raw.toLocationId) : null,
      notes: raw.notes?.trim() || null,
      lines: raw.lines.map((line) => ({
        lineId: Number(line.lineId),
        quantityActual: Number(line.quantityActual),
        unitCost: line.unitCost ? Number(line.unitCost) : null
      }))
    };

    this.saving.set(true);
    this.inventoryApi
      .receiveDocument(doc.id, payload)
      .pipe(take(1))
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.receiveDialogVisible.set(false);
          this.notificationService.success('Documentos', 'Recepción registrada.');
          this.refreshDocument(updated);
          this.loadDocuments();
        },
        error: (error) => {
          this.saving.set(false);
          if (!isHttp403(error)) {
            this.notificationService.error('Documentos', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected execute(doc: InventoryDocument): void {
    this.inventoryApi
      .executeDocument(doc.id)
      .pipe(take(1))
      .subscribe({
        next: (updated) => {
          this.notificationService.success('Documentos', 'Documento ejecutado.');
          this.refreshDocument(updated);
          this.loadDocuments();
        },
        error: (error) => {
          if (!isHttp403(error)) {
            this.notificationService.error('Documentos', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected approveVariance(doc: InventoryDocument): void {
    this.inventoryApi
      .approveVariance(doc.id)
      .pipe(take(1))
      .subscribe({
        next: (updated) => {
          this.notificationService.success('Documentos', 'Diferencias aprobadas.');
          this.refreshDocument(updated);
          this.loadDocuments();
        },
        error: (error) => {
          if (!isHttp403(error)) {
            this.notificationService.error('Documentos', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected applyVariance(doc: InventoryDocument): void {
    this.inventoryApi
      .applyVariance(doc.id)
      .pipe(take(1))
      .subscribe({
        next: (updated) => {
          this.notificationService.success('Documentos', 'Diferencias aplicadas al inventario.');
          this.refreshDocument(updated);
          this.loadDocuments();
        },
        error: (error) => {
          if (!isHttp403(error)) {
            this.notificationService.error('Documentos', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected cancel(doc: InventoryDocument): void {
    const reason = window.prompt('Motivo de cancelación:', 'Cancelado por usuario');
    if (!reason?.trim()) return;
    this.inventoryApi
      .cancelDocument(doc.id, reason.trim())
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.notificationService.success('Documentos', 'Documento cancelado.');
          this.loadDocuments();
          this.detailDialogVisible.set(false);
        },
        error: (error) => {
          if (!isHttp403(error)) {
            this.notificationService.error('Documentos', extractApiErrorMessage(error.error));
          }
        }
      });
  }

  protected canApprove(doc: InventoryDocument): boolean {
    return this.isAdmin() && doc.type === 'ORDEN_COMPRA' && doc.status === 'BORRADOR';
  }

  protected canReceive(doc: InventoryDocument): boolean {
    return (
      (doc.type === 'ORDEN_COMPRA' && doc.status === 'APROBADO') ||
      (doc.type === 'RECEPCION' && doc.status === 'BORRADOR')
    );
  }

  protected canExecute(doc: InventoryDocument): boolean {
    return ['TRANSFERENCIA', 'AJUSTE'].includes(doc.type) && doc.status === 'BORRADOR';
  }

  protected canApproveVariance(doc: InventoryDocument): boolean {
    return this.isAdmin() && doc.type === 'CONTEO' && doc.status === 'PENDIENTE_APROBACION';
  }

  protected canApplyVariance(doc: InventoryDocument): boolean {
    return doc.type === 'CONTEO' && doc.status === 'APROBADO';
  }

  protected canCancel(doc: InventoryDocument): boolean {
    return !['RECIBIDO', 'EJECUTADO', 'CANCELADO'].includes(doc.status);
  }

  protected label(value: string): string {
    return value
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private refreshDocument(doc: InventoryDocument): void {
    this.selectedDocument.set(doc);
    this.documents.update((list) => list.map((item) => (item.id === doc.id ? doc : item)));
  }

  private createLineGroup() {
    return this.fb.nonNullable.group({
      itemId: ['', Validators.required],
      quantityExpected: [1, [Validators.required, Validators.min(1)]],
      unitCost: [''],
      notes: ['']
    });
  }

  private createReceiveLineGroup(lineId: number, qty: number, unitCost: number | null) {
    return this.fb.nonNullable.group({
      lineId: [lineId],
      quantityActual: [qty, [Validators.required, Validators.min(0)]],
      unitCost: [unitCost ?? '']
    });
  }
}
