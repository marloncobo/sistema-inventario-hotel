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
  fromLocationId: number | null;
  fromLocationCode: string | null;
  fromLocationName: string | null;
  toLocationId: number | null;
  toLocationCode: string | null;
  toLocationName: string | null;
  documentId: number | null;
  documentCode: string | null;
  unitCost: number | null;
  legacy: boolean | null;
  status: string;
  createdAt: string;
}

export interface Location {
  id: number;
  code: string;
  name: string;
  type: string;
  parentId: number | null;
  parentCode: string | null;
  roomNumber: string | null;
  description: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreateLocationRequest {
  code: string;
  name: string;
  type: string;
  parentLocationId: number | null;
  roomNumber: string | null;
  description: string | null;
  active: boolean | null;
}

export interface UpdateLocationRequest {
  code: string;
  name: string;
  type: string;
  parentLocationId: number | null;
  roomNumber: string | null;
  description: string | null;
  active: boolean | null;
}

export interface StockByLocationView {
  itemId: number;
  itemCode: string;
  itemName: string;
  locationId: number;
  locationCode: string;
  locationName: string;
  locationType: string;
  quantity: number;
  minStock: number | null;
}

export interface ItemStockBreakdown {
  itemId: number;
  itemCode: string;
  itemName: string;
  total: number;
  totalRounded: number;
  byLocation: StockByLocationView[];
}

export interface TransferRequest {
  itemId: number;
  fromLocationId: number;
  toLocationId: number;
  quantity: number;
  operationalResponsible: string | null;
  referenceText: string | null;
}

export interface InventoryDocumentLine {
  id: number;
  documentId: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  quantityExpected: number;
  quantityActual: number | null;
  unitCost: number | null;
  notes: string | null;
  lineNumber: number;
}

export interface InventoryDocument {
  id: number;
  code: string;
  type: string;
  status: string;
  providerId: number | null;
  providerName: string | null;
  fromLocationId: number | null;
  fromLocationCode: string | null;
  fromLocationName: string | null;
  toLocationId: number | null;
  toLocationCode: string | null;
  toLocationName: string | null;
  responsible: string;
  approver: string | null;
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
  lines: InventoryDocumentLine[];
}

export interface CreateDocumentRequest {
  type: string;
  providerName: string | null;
  fromLocationId: number | null;
  toLocationId: number | null;
  notes: string | null;
  lines: CreateDocumentLineRequest[];
}

export interface CreateDocumentLineRequest {
  itemId: number;
  quantityExpected: number;
  unitCost: number | null;
  notes: string | null;
}

export interface ReceiveDocumentRequest {
  toLocationId: number | null;
  notes: string | null;
  lines: ReceiveDocumentLineRequest[];
}

export interface ReceiveDocumentLineRequest {
  lineId: number;
  quantityActual: number;
  unitCost: number | null;
}

export interface CreateSupplyItemRequest {
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
  targetLocationType?: string | null;
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

export interface LocationFilters {
  type?: string | null;
  activeOnly?: boolean | null;
}

export interface DocumentFilters {
  type?: string | null;
  status?: string | null;
}

export interface RoomPar {
  id: number;
  roomType: string;
  scope: string;
  name: string;
  active: boolean;
  createdAt: string;
  lines: RoomParLine[];
}

export interface RoomParLine {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  targetQuantity: number;
  mandatory: boolean;
  notes: string | null;
}

export interface CreateRoomParRequest {
  roomType: string;
  scope: string;
  name: string;
  active: boolean | null;
  lines: RoomParLineRequest[];
}

export interface UpdateRoomParRequest {
  name: string;
  active: boolean | null;
  lines: RoomParLineRequest[];
}

export interface RoomParLineRequest {
  itemId: number;
  targetQuantity: number;
  mandatory: boolean | null;
  notes: string | null;
}

export interface RoomParComparisonLine {
  itemId: number;
  itemCode: string;
  itemName: string;
  targetQuantity: number;
  actualQuantity: number;
  gapQuantity: number;
  status: string;
  mandatory: boolean;
}

export interface RoomParComparisonView {
  roomNumber: string | null;
  roomType: string;
  scope: string;
  locationId: number | null;
  locationCode: string | null;
  locationName: string | null;
  overallStatus: string;
  lines: RoomParComparisonLine[];
}

export interface ReplenishmentSuggestion {
  roomNumber: string;
  roomType: string;
  scope: string;
  locationId: number;
  locationCode: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  targetQuantity: number;
  actualQuantity: number;
  suggestedQuantity: number;
  availableAtBodega: number;
  priority: string;
}

export interface InitCountRequest {
  locationId: number;
  notes: string | null;
}

export interface RecordCountRequest {
  lines: RecordCountLine[];
  notes: string | null;
}

export interface RecordCountLine {
  lineId: number;
  quantityActual: number;
}
