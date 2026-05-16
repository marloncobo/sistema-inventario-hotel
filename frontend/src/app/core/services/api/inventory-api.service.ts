import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import {
  type CatalogEntity,
  type CatalogRequest,
  type CreateDocumentRequest,
  type CreateRoomParRequest,
  type CreateLocationRequest,
  type CreateSupplyItemRequest,
  type DateRangeFilters,
  type DocumentFilters,
  type InternalStockDecreaseRequest,
  type InventoryDocument,
  type InventoryMovement,
  type InventorySummaryReport,
  type ItemStockBreakdown,
  type Location,
  type LocationFilters,
  type LowStockAlert,
  type MovementFilters,
  type Provider,
  type InitCountRequest,
  type ReceiveDocumentRequest,
  type RecordCountRequest,
  type ReplenishmentSuggestion,
  type RoomPar,
  type RoomParComparisonView,
  type StockByLocationView,
  type StockChangeResponse,
  type StockEntryRequest,
  type StockReturnRequest,
  type SupplyItem,
  type TopUsedItemReport,
  type TransferRequest,
  type UnitOfMeasure,
  type UpdateLocationRequest,
  type UpdateRoomParRequest,
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

  getLocations(filters: LocationFilters = {}): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.baseUrl}/locations`, {
      params: buildHttpParams(filters)
    });
  }

  getLocation(id: number): Observable<Location> {
    return this.http.get<Location>(`${this.baseUrl}/locations/${id}`);
  }

  createLocation(payload: CreateLocationRequest): Observable<Location> {
    return this.http.post<Location>(`${this.baseUrl}/locations`, payload);
  }

  updateLocation(id: number, payload: UpdateLocationRequest): Observable<Location> {
    return this.http.put<Location>(`${this.baseUrl}/locations/${id}`, payload);
  }

  deactivateLocation(id: number): Observable<Location> {
    return this.http.patch<Location>(`${this.baseUrl}/locations/${id}/deactivate`, {});
  }

  getStockByItem(itemId: number): Observable<ItemStockBreakdown> {
    return this.http.get<ItemStockBreakdown>(`${this.baseUrl}/stock/items/${itemId}`);
  }

  getStockByLocation(locationId: number): Observable<StockByLocationView[]> {
    return this.http.get<StockByLocationView[]>(`${this.baseUrl}/stock/locations/${locationId}`);
  }

  transferStock(payload: TransferRequest): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(`${this.baseUrl}/stock/transfers`, payload);
  }

  getDocuments(filters: DocumentFilters = {}): Observable<InventoryDocument[]> {
    return this.http.get<InventoryDocument[]>(`${this.baseUrl}/documents`, {
      params: buildHttpParams(filters)
    });
  }

  getDocument(id: number): Observable<InventoryDocument> {
    return this.http.get<InventoryDocument>(`${this.baseUrl}/documents/${id}`);
  }

  createDocument(payload: CreateDocumentRequest): Observable<InventoryDocument> {
    return this.http.post<InventoryDocument>(`${this.baseUrl}/documents`, payload);
  }

  approveDocument(id: number): Observable<InventoryDocument> {
    return this.http.post<InventoryDocument>(`${this.baseUrl}/documents/${id}/approve`, {});
  }

  receiveDocument(id: number, payload: ReceiveDocumentRequest): Observable<InventoryDocument> {
    return this.http.post<InventoryDocument>(`${this.baseUrl}/documents/${id}/receive`, payload);
  }

  executeDocument(id: number): Observable<InventoryDocument> {
    return this.http.post<InventoryDocument>(`${this.baseUrl}/documents/${id}/execute`, {});
  }

  cancelDocument(id: number, reason: string): Observable<InventoryDocument> {
    return this.http.post<InventoryDocument>(`${this.baseUrl}/documents/${id}/cancel`, { reason });
  }

  initCount(payload: InitCountRequest): Observable<InventoryDocument> {
    return this.http.post<InventoryDocument>(`${this.baseUrl}/documents/counts/init`, payload);
  }

  recordCount(id: number, payload: RecordCountRequest): Observable<InventoryDocument> {
    return this.http.post<InventoryDocument>(`${this.baseUrl}/documents/${id}/record-count`, payload);
  }

  completeCount(id: number): Observable<InventoryDocument> {
    return this.http.post<InventoryDocument>(`${this.baseUrl}/documents/${id}/complete-count`, {});
  }

  approveVariance(id: number): Observable<InventoryDocument> {
    return this.http.post<InventoryDocument>(`${this.baseUrl}/documents/${id}/approve-variance`, {});
  }

  applyVariance(id: number): Observable<InventoryDocument> {
    return this.http.post<InventoryDocument>(`${this.baseUrl}/documents/${id}/apply-variance`, {});
  }

  getRoomPars(activeOnly = true): Observable<RoomPar[]> {
    return this.http.get<RoomPar[]>(`${this.baseUrl}/room-pars`, {
      params: buildHttpParams({ activeOnly })
    });
  }

  getRoomPar(id: number): Observable<RoomPar> {
    return this.http.get<RoomPar>(`${this.baseUrl}/room-pars/${id}`);
  }

  createRoomPar(payload: CreateRoomParRequest): Observable<RoomPar> {
    return this.http.post<RoomPar>(`${this.baseUrl}/room-pars`, payload);
  }

  updateRoomPar(id: number, payload: UpdateRoomParRequest): Observable<RoomPar> {
    return this.http.put<RoomPar>(`${this.baseUrl}/room-pars/${id}`, payload);
  }

  compareRoomPar(roomNumber: string, scope: string): Observable<RoomParComparisonView> {
    return this.http.get<RoomParComparisonView>(`${this.baseUrl}/room-pars/compare`, {
      params: buildHttpParams({ roomNumber, scope })
    });
  }

  getReplenishmentSuggestions(params: {
    roomNumber?: string | null;
    scope?: string | null;
    roomType?: string | null;
  }): Observable<ReplenishmentSuggestion[]> {
    return this.http.get<ReplenishmentSuggestion[]>(`${this.baseUrl}/replenishment/suggestions`, {
      params: buildHttpParams(params)
    });
  }
}
