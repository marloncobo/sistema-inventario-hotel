import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import {
  type AssignSupplyRequest,
  type AssignmentFilters,
  type ConsumptionReportFilters,
  type CreateRoomRequest,
  type DistributionReportFilters,
  type Room,
  type RoomConsumptionReport,
  type RoomDistributionReport,
  type RoomSupplyAssignment,
  type RoomValidationResponse,
  type UpdateRoomStatusRequest
} from '@models/room.model';
import { buildHttpParams } from './http-params.util';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoomsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/rooms/api/rooms`;

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(this.baseUrl);
  }

  getRoom(id: number): Observable<Room> {
    return this.http.get<Room>(`${this.baseUrl}/${id}`);
  }

  getRoomByNumber(number: string): Observable<RoomValidationResponse> {
    return this.http.get<RoomValidationResponse>(`${this.baseUrl}/number/${number}`);
  }

  createRoom(payload: CreateRoomRequest): Observable<Room> {
    return this.http.post<Room>(this.baseUrl, payload);
  }

  updateRoomStatus(id: number, payload: UpdateRoomStatusRequest): Observable<Room> {
    return this.http.patch<Room>(`${this.baseUrl}/${id}/status`, payload);
  }

  assignSupply(roomId: number, payload: AssignSupplyRequest): Observable<RoomSupplyAssignment> {
    return this.http.post<RoomSupplyAssignment>(
      `${this.baseUrl}/${roomId}/supplies/assign`,
      payload
    );
  }

  getRoomAssignments(roomId: number): Observable<RoomSupplyAssignment[]> {
    return this.http.get<RoomSupplyAssignment[]>(`${this.baseUrl}/${roomId}/supplies`);
  }

  getAllAssignments(filters: AssignmentFilters): Observable<RoomSupplyAssignment[]> {
    return this.http.get<RoomSupplyAssignment[]>(`${this.baseUrl}/supplies`, {
      params: buildHttpParams(filters)
    });
  }

  getConsumptionReport(
    filters: ConsumptionReportFilters
  ): Observable<RoomConsumptionReport[]> {
    return this.http.get<RoomConsumptionReport[]>(`${this.baseUrl}/reports/consumption`, {
      params: buildHttpParams(filters)
    });
  }

  getDistributionReport(
    filters: DistributionReportFilters
  ): Observable<RoomDistributionReport[]> {
    return this.http.get<RoomDistributionReport[]>(`${this.baseUrl}/reports/distribution`, {
      params: buildHttpParams(filters)
    });
  }

  exportConsumptionReport(
    format: 'xlsx' | 'csv' | 'pdf',
    filters: ConsumptionReportFilters
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/reports/consumption/export`, {
      params: buildHttpParams({ format, ...filters }),
      observe: 'response',
      responseType: 'blob'
    });
  }

  exportDistributionReport(
    format: 'xlsx' | 'csv' | 'pdf',
    filters: DistributionReportFilters
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/reports/distribution/export`, {
      params: buildHttpParams({ format, ...filters }),
      observe: 'response',
      responseType: 'blob'
    });
  }
}
