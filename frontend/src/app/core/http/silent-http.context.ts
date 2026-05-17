import { HttpContext, HttpContextToken } from '@angular/common/http';

/** Si es true, el interceptor global no muestra toast para errores HTTP. */
export const SILENT_HTTP_ERROR = new HttpContextToken<boolean>(() => false);

export function silentHttpContext(): HttpContext {
  return new HttpContext().set(SILENT_HTTP_ERROR, true);
}
