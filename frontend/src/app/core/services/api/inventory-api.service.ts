import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import {
  type CatalogEntity,
  type CatalogRequest,
  type CreateSupplyItemRequest,
  type DateRangeFilters,
  type InternalStockDecreaseRequest,
  type InventoryMovement,
  type InventorySummaryReport,
  type LowStockAlert,
  type MovementFilters,
  type Provider,
  type StockChangeResponse,
  type StockEntryRequest,
  type StockReturnRequest,
  type SupplyItem,
  type TopUsedItemReport,
  type UnitOfMeasure,
  type UpdateSupplyItemRequest,
  type VoidMovementRequest
} from '@models/inventory.model';
import { buildHttpParams } from './http-params.util';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/inventory/api/inventory`;

  getItems(category?: string | null): Observable<SupplyItem[]> {
    return this.http.get<SupplyItem[]>(`${this.baseUrl}/items`, {
      params: buildHttpParams({ category })
    });
  }

  getItem(id: number): Observable<SupplyItem> {
    return this.http.get<SupplyItem>(`${this.baseUrl}/items/${id}`);
  }

  createItem(payload: CreateSupplyItemRequest): Observable<SupplyItem> {
    return this.http.post<SupplyItem>(`${this.baseUrl}/items`, payload);
  }

  updateItem(id: number, payload: UpdateSupplyItemRequest): Observable<SupplyItem> {
    return this.http.put<SupplyItem>(`${this.baseUrl}/items/${id}`, payload);
  }

  deactivateItem(id: number): Observable<SupplyItem> {
    return this.http.patch<SupplyItem>(`${this.baseUrl}/items/${id}/deactivate`, {});
  }

  addStockEntry(id: number, payload: StockEntryRequest): Observable<SupplyItem> {
    return this.http.post<SupplyItem>(`${this.baseUrl}/items/${id}/entries`, payload);
  }

  returnStock(id: number, payload: StockReturnRequest): Observable<StockChangeResponse> {
    return this.http.post<StockChangeResponse>(`${this.baseUrl}/items/${id}/returns`, payload);
  }

  decreaseInternalStock(
    payload: InternalStockDecreaseRequest
  ): Observable<StockChangeResponse> {
    return this.http.post<StockChangeResponse>(
      `${this.baseUrl}/internal/items/decrease`,
      payload
    );
  }

  getLowStockItems(): Observable<SupplyItem[]> {
    return this.http.get<SupplyItem[]>(`${this.baseUrl}/items/low-stock`);
  }

  getLowStockAlerts(openOnly = true): Observable<LowStockAlert[]> {
    return this.http.get<LowStockAlert[]>(`${this.baseUrl}/alerts/low-stock`, {
      params: buildHttpParams({ openOnly })
    });
  }

  getMovements(filters: MovementFilters): Observable<InventoryMovement[]> {
    return this.http.get<InventoryMovement[]>(`${this.baseUrl}/movements`, {
      params: buildHttpParams(filters)
    });
  }

  voidMovement(id: number, payload: VoidMovementRequest): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(`${this.baseUrl}/movements/${id}/void`, payload);
  }

  getInventoryReport(filters: DateRangeFilters): Observable<InventorySummaryReport[]> {
    return this.http.get<InventorySummaryReport[]>(`${this.baseUrl}/reports/inventory`, {
      params: buildHttpParams(filters)
    });
  }

  getTopUsedReport(filters: DateRangeFilters): Observable<TopUsedItemReport[]> {
    return this.http.get<TopUsedItemReport[]>(`${this.baseUrl}/reports/top-used`, {
      params: buildHttpParams(filters)
    });
  }

  exportInventoryReport(
    format: 'xlsx' | 'csv' | 'pdf',
    filters: DateRangeFilters
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/reports/inventory/export`, {
      params: buildHttpParams({ format, ...filters }),
      observe: 'response',
      responseType: 'blob'
    });
  }

  exportTopUsedReport(
    format: 'xlsx' | 'csv' | 'pdf',
    filters: DateRangeFilters
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/reports/top-used/export`, {
      params: buildHttpParams({ format, ...filters }),
      observe: 'response',
      responseType: 'blob'
    });
  }

  getCategories(): Observable<CatalogEntity[]> {
    return this.http.get<CatalogEntity[]>(`${this.baseUrl}/catalogs/categories`);
  }

  createCategory(payload: CatalogRequest): Observable<CatalogEntity> {
    return this.http.post<CatalogEntity>(`${this.baseUrl}/catalogs/categories`, payload);
  }

  updateCategory(id: number, payload: CatalogRequest): Observable<CatalogEntity> {
    return this.http.put<CatalogEntity>(`${this.baseUrl}/catalogs/categories/${id}`, payload);
  }

  getUnits(): Observable<UnitOfMeasure[]> {
    return this.http.get<UnitOfMeasure[]>(`${this.baseUrl}/catalogs/units`);
  }

  createUnit(payload: CatalogRequest): Observable<UnitOfMeasure> {
    return this.http.post<UnitOfMeasure>(`${this.baseUrl}/catalogs/units`, payload);
  }

  updateUnit(id: number, payload: CatalogRequest): Observable<UnitOfMeasure> {
    return this.http.put<UnitOfMeasure>(`${this.baseUrl}/catalogs/units/${id}`, payload);
  }

  getProviders(): Observable<Provider[]> {
    return this.http.get<Provider[]>(`${this.baseUrl}/catalogs/providers`);
  }

  createProvider(payload: CatalogRequest): Observable<Provider> {
    return this.http.post<Provider>(`${this.baseUrl}/catalogs/providers`, payload);
  }

  updateProvider(id: number, payload: CatalogRequest): Observable<Provider> {
    return this.http.put<Provider>(`${this.baseUrl}/catalogs/providers/${id}`, payload);
  }

  getAreas(): Observable<CatalogEntity[]> {
    return this.http.get<CatalogEntity[]>(`${this.baseUrl}/catalogs/areas`);
  }

  createArea(payload: CatalogRequest): Observable<CatalogEntity> {
    return this.http.post<CatalogEntity>(`${this.baseUrl}/catalogs/areas`, payload);
  }

  updateArea(id: number, payload: CatalogRequest): Observable<CatalogEntity> {
    return this.http.put<CatalogEntity>(`${this.baseUrl}/catalogs/areas/${id}`, payload);
  }
}
