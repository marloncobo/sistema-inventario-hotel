export const ROOM_TYPES = ['ESTANDAR', 'EJECUTIVA', 'FAMILIAR'] as const;

export const ROOM_STATUS_OPTIONS = [
  'DISPONIBLE',
  'OCUPADA',
  'EN_LIMPIEZA',
  'MANTENIMIENTO',
  'FUERA_DE_SERVICIO'
] as const;

export const ASSIGNMENT_TYPE_OPTIONS = [
  'HABITACION',
  'MINIBAR',
  'KIT_ASEO',
  'SERVICIO_HABITACION'
] as const;

export const EXPORT_FORMAT_OPTIONS = ['xlsx', 'csv', 'pdf'] as const;

export const LOCATION_TYPE_OPTIONS = [
  'BODEGA',
  'PISO',
  'CARRITO',
  'HABITACION',
  'MINIBAR',
  'LAVANDERIA',
  'RESTAURANTE',
  'MANTENIMIENTO',
  'OTRO'
] as const;

export const DOCUMENT_TYPE_OPTIONS = [
  'ORDEN_COMPRA',
  'RECEPCION',
  'TRANSFERENCIA',
  'AJUSTE',
  'CONTEO'
] as const;

export const DOCUMENT_STATUS_OPTIONS = [
  'BORRADOR',
  'APROBADO',
  'RECIBIDO',
  'EJECUTADO',
  'CANCELADO',
  'PENDIENTE_APROBACION'
] as const;

export const ROOM_PAR_SCOPE_OPTIONS = [
  'HABITACION',
  'MINIBAR',
  'KIT_ASEO',
  'SERVICIO_HABITACION'
] as const;
