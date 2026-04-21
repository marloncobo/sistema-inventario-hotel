export interface Room {
  id: number;
  number: string;
  type: string;
  status: string;
  capacity: number;
  floor: number;
  observations: string | null;
  active: boolean;
}

export interface CreateRoomRequest {
  number: string;
  type: string;
  status: string;
  capacity: number;
  floor: number;
  observations: string | null;
}

export interface UpdateRoomStatusRequest {
  status: string;
}

export interface RoomValidationResponse {
  number: string;
  type: string;
  status: string;
  active: boolean;
}

export interface RoomSupplyAssignment {
  id: number;
  roomId: number;
  roomNumber: string;
  itemId: number;
  itemName: string;
  quantity: number;
  deliveredBy: string;
  guestName: string | null;
  assignmentType: string;
  createdAt: string;
}

export interface AssignSupplyRequest {
  itemId: number;
  quantity: number;
  deliveredBy: string;
  guestName: string | null;
  assignmentType: string | null;
}

export interface RoomConsumptionReport {
  roomNumber: string;
  roomType: string;
  itemId: number;
  itemName: string;
  assignmentType: string;
  deliveredBy: string;
  totalQuantity: number;
}

export interface RoomDistributionReport {
  roomNumber: string;
  roomType: string;
  itemId: number;
  itemName: string;
  quantity: number;
  assignmentType: string;
  deliveredBy: string;
  guestName: string | null;
  deliveredAt: string | null;
}

export interface AssignmentFilters {
  roomNumber?: string | null;
  assignmentType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface DistributionReportFilters extends AssignmentFilters {
  roomType?: string | null;
  deliveredBy?: string | null;
}

export interface ConsumptionReportFilters extends AssignmentFilters {
  roomType?: string | null;
}
