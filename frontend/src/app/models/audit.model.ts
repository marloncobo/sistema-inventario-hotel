export interface AuditLog {
  id: number;
  action: string;
  entityName: string;
  entityId: number | null;
  username: string;
  detail: string | null;
  createdAt: string;
}

export interface AuditFilters {
  action?: string | null;
  username?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}
