import { HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, finalize } from 'rxjs';
import { UiStateService } from '@core/services/ui/ui-state.service';

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  const uiStateService = inject(UiStateService);
  const isAssetRequest =
    request.url.includes('/assets/') ||
    request.url.endsWith('.svg') ||
    request.url.endsWith('.png') ||
    request.url.endsWith('.jpg') ||
    request.url.endsWith('.ico');

  if (!isAssetRequest) {
    uiStateService.beginRequest();
  }

  return next(request).pipe(
    tap((event) => {
      if (event.type === HttpEventType.Response && event.status < 500) {
        uiStateService.clearIssue();
      }
    }),
    finalize(() => {
      if (!isAssetRequest) {
        uiStateService.endRequest();
      }
    })
  );
};
