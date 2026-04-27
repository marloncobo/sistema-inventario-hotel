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
  const includesTechnicalPath =
    lowerCased.includes('/auth/') ||
    lowerCased.includes('/inventory/') ||
    lowerCased.includes('/rooms/');
  const looksTechnical = TECHNICAL_ERROR_HINTS.some((hint) => lowerCased.includes(hint));

  if (looksTechnical || includesTechnicalPath) {
    return 'No fue posible completar la operación en este momento.';
  }

  return normalized;
}
