import { HttpErrorResponse } from '@angular/common/http';

/** HTTP 403: no mostrar toasts ni mensajes de formulario genéricos en el cliente. */
export function isHttp403(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 403;
}
