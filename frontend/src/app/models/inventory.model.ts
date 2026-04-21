export interface SupplyItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string | null;
  providerName: string | null;
  stock: number;
  minStock: number;
  maxStock: number | null;
  active: boolean;
}

export interface CatalogEntity {
  id: number;
  code: string;
  name: string;
  active: boolean;
}

export interface UnitOfMeasure extends CatalogEntity {
  abbreviation: string | null;
}

export interface Provider {
  id: number;
  code?: string | null;
  documentNumber: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
}

export interface LowStockAlert {
  id: number;
  itemId: number;
  itemName: string;
  currentStock: number;
  minStock: number;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface InventoryMovement {
  id: number;
  itemId: number;
  itemName: string;
  movementType: string;
  origin: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  roomNumber: string | null;
  areaName: string | null;
  providerName: string | null;
  responsible: string;
  operationalResponsible: string | null;
  referenceText: string | null;
  sourceMovementId: number | null;
  correctionReason: string | null;
  correctionMovementId: number | null;
  status: string;
  createdAt: string;
}

export interface CreateSupplyItemRequest {
  code: string;
  name: string;
  description: string | null;
  category: string;
  unit: string;
  providerName: string | null;
  stock: number;
  minStock: number;
  maxStock: number | null;
}

export interface UpdateSupplyItemRequest {
  code: string;
  name: string;
  description: string | null;
  category: string;
  unit: string;
  providerName: string | null;
  minStock: number;
  maxStock: number | null;
  active: boolean | null;
}

export interface StockEntryRequest {
  quantity: number;
  providerName: string;
  referenceText: string | null;
}

export interface StockReturnRequest {
  quantity: number;
  roomNumber: string | null;
  areaName: string | null;
  operationalResponsible: string | null;
  referenceText: string | null;
  sourceMovementId: number;
}

export interface InternalStockDecreaseRequest {
  itemId: number;
  quantity: number;
  roomNumber: string | null;
  areaName: string | null;
  origin: string;
  operationalResponsible: string | null;
  referenceText: string | null;
}

export interface StockChangeResponse {
  itemId: number;
  itemName: string;
  remainingStock: number;
  message: string;
}

export interface VoidMovementRequest {
  reason: string;
}

export interface InventorySummaryReport {
  itemId: number;
  code: string;
  name: string;
  category: string | null;
  unit: string | null;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  lowStock: boolean;
  turnoverQuantity: number;
}

export interface TopUsedItemReport {
  itemId: number;
  itemName: string;
  totalQuantity: number;
}

export interface CatalogRequest {
  code: string;
  name: string;
  abbreviation: string | null;
  documentNumber: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
}

export interface MovementFilters {
  type?: string | null;
  origin?: string | null;
  roomNumber?: string | null;
  responsible?: string | null;
  operationalResponsible?: string | null;
  areaName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface DateRangeFilters {
  startDate?: string | null;
  endDate?: string | null;
}
