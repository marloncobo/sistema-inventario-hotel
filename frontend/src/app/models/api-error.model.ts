export interface AuthApiError {
  error?: string;
}

export interface RestApiError {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  errors?: Record<string, string>;
}

export type KnownApiError = AuthApiError | RestApiError | null | undefined;

const DEFAULT_API_ERROR_MESSAGE = 'No fue posible completar la operación.';
const TECHNICAL_ERROR_HINTS = [
  'http://',
  'https://',
  'localhost',
  'backend',
  'gateway',
  'endpoint',
  'inventory-service',
  'rooms-service',
  'failed to fetch',
  'networkerror',
  'network error',
  'econnrefused',
  'err_connection',
  'http failure response',
  'unknown error',
  'chunkloaderror',
  'java.',
  'exception'
];

export function extractApiErrorMessage(error: KnownApiError): string {
  if (!error) {
    return DEFAULT_API_ERROR_MESSAGE;
  }

  if ('message' in error && error.message) {
    return sanitizeApiErrorMessage(error.message);
  }

  if ('error' in error && error.error) {
    return sanitizeApiErrorMessage(error.error);
  }

  return DEFAULT_API_ERROR_MESSAGE;
}

export function extractApiFieldErrors(error: KnownApiError): Record<string, string> {
  if (!error || !('errors' in error) || !error.errors) {
    return {};
  }

  return error.errors;
}

function sanitizeApiErrorMessage(message: string): string {
  const normalized = message.trim();

  if (!normalized) {
    return DEFAULT_API_ERROR_MESSAGE;
  }

  const lowerCased = normalized.toLowerCase();

  // Mensajes de negocio del backend (español): mostrarlos tal cual.
  if (
    /[áéíóúñ]/i.test(normalized) ||
    lowerCased.startsWith('no hay ') ||
    lowerCased.startsWith('no existe') ||
    lowerCased.startsWith('no fue posible validar') ||
    lowerCased.startsWith('el insumo') ||
    lowerCased.startsWith('la habitación') ||
    lowerCased.startsWith('stock insuficiente') ||
    lowerCased.startsWith('ya existe')
  ) {
    return normalized;
  }

  const includesTechnicalPath =
    lowerCased.includes('/api/') ||
    lowerCased.includes('/auth/') ||
    lowerCased.includes('/inventory/') ||
    lowerCased.includes('/rooms/');
  const looksTechnical = TECHNICAL_ERROR_HINTS.some((hint) => lowerCased.includes(hint));

  if (looksTechnical || includesTechnicalPath) {
    return DEFAULT_API_ERROR_MESSAGE;
  }

  return normalized;
}
