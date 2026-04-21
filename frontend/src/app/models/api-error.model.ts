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

export function extractApiErrorMessage(error: KnownApiError): string {
  if (!error) {
    return 'No fue posible completar la operación.';
  }

  if ('message' in error && error.message) {
    return error.message;
  }

  if ('error' in error && error.error) {
    return error.error;
  }

  return 'No fue posible completar la operación.';
}

export function extractApiFieldErrors(error: KnownApiError): Record<string, string> {
  if (!error || !('errors' in error) || !error.errors) {
    return {};
  }

  return error.errors;
}
