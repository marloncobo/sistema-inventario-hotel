import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { UiStateService } from '@core/services/ui/ui-state.service';
import { extractApiErrorMessage } from '@models/api-error.model';
import { catchError, throwError } from 'rxjs';

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
          title: 'Gateway no disponible',
          detail: 'No fue posible comunicarse con http://localhost:8080.'
        });

        if (shouldNotify) {
          notificationService.error(
            'Gateway no disponible',
            'No fue posible comunicarse con http://localhost:8080.'
          );
        }
      } else if (error.status === 401) {
        if (isLoginRequest) {
          notificationService.error('Acceso denegado', message);
        } else {
          authService.logout(false);
          notificationService.warn('Sesion vencida', 'Debes iniciar sesion nuevamente.');
          void router.navigate(['/login']);
        }
      } else if (error.status === 403) {
        notificationService.warn('Acceso restringido', message);
        void router.navigate(['/forbidden']);
      } else if (error.status >= 500) {
        const shouldNotify = uiStateService.reportIssue({
          kind: 'server',
          title: 'Error del servidor',
          detail: message
        });

        if (shouldNotify) {
          notificationService.error('Error del servidor', message);
        }
      } else if (!isLoginRequest && !hasFieldErrors) {
        notificationService.error('Operacion no completada', message);
      }

      return throwError(() => error);
    })
  );
};
