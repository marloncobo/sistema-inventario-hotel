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
