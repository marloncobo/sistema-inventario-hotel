import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SILENT_HTTP_ERROR } from '@core/http/silent-http.context';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { UiStateService } from '@core/services/ui/ui-state.service';
import { extractApiErrorMessage } from '@models/api-error.model';
import { catchError, throwError } from 'rxjs';

const DEFAULT_FORBIDDEN_MESSAGE = 'No fue posible completar la operación.';
let lastForbiddenToastAt = 0;
const FORBIDDEN_TOAST_COOLDOWN_MS = 2500;

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);
  const uiStateService = inject(UiStateService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = extractApiErrorMessage(error.error);
      const isLoginRequest = request.url.endsWith('/auth/login');
      const hasFieldErrors =
        !!error.error &&
        typeof error.error === 'object' &&
        'errors' in error.error &&
        !!(error.error as { errors?: Record<string, string> }).errors;

      if (error.status === 0) {
        const shouldNotify = uiStateService.reportIssue({
          kind: 'offline',
          title: 'Servicio no disponible',
          detail: 'No fue posible comunicarse con la plataforma en este momento.'
        });

        if (shouldNotify) {
          notificationService.error(
            'Servicio no disponible',
            'No fue posible comunicarse con la plataforma en este momento.'
          );
        }
      } else if (error.status === 401) {
        if (isLoginRequest) {
          notificationService.error('Acceso denegado', message);
        } else {
          authService.logout(false);
          notificationService.warn('Sesión vencida', 'Debes iniciar sesión nuevamente.');
          void router.navigate(['/login']);
        }
      } else if (error.status >= 500) {
        const shouldNotify = uiStateService.reportIssue({
          kind: 'server',
          title: 'Error del servidor',
          detail: message
        });

        if (shouldNotify) {
          notificationService.error('Error del servidor', message);
        }
      } else if (!isLoginRequest && !hasFieldErrors && !request.context.get(SILENT_HTTP_ERROR)) {
        if (error.status === 403) {
          const now = Date.now();
          if (now - lastForbiddenToastAt >= FORBIDDEN_TOAST_COOLDOWN_MS) {
            lastForbiddenToastAt = now;
            notificationService.error(
              'Sin permiso',
              message === DEFAULT_FORBIDDEN_MESSAGE
                ? 'Tu rol no tiene permiso para esta operación. Si crees que es un error, cierra sesión y vuelve a entrar.'
                : message
            );
          }
        } else {
          notificationService.error('Operación no completada', message);
        }
      }

      return throwError(() => error);
    })
  );
};
