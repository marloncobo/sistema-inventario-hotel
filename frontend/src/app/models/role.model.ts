export type AppRole = 'ADMIN' | 'ALMACENISTA' | 'RECEPCION' | 'SERVICIO';

export const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: 'Administrador',
  ALMACENISTA: 'Almacenista',
  RECEPCION: 'Recepción',
  SERVICIO: 'Servicio'
};
