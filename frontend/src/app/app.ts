import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Event,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet
} from '@angular/router';
import { NotificationService } from '@core/services/ui/notification.service';
import { UiStateService } from '@core/services/ui/ui-state.service';
import { GlobalStatusComponent } from '@shared/components/global-status/global-status.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalStatusComponent],
  template: `
    <app-global-status />
    <router-outlet />
  `
})
export class App {
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly uiStateService = inject(UiStateService);

  constructor() {
    this.router.events
      .pipe(
        filter((event: Event) => this.isNavigationEvent(event)),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          sessionStorage.removeItem('hotel-inventory-chunk-reload-attempt');
        }
        this.uiStateService.setNavigating(event instanceof NavigationStart);
      });

    this.router.events
      .pipe(
        filter((event: Event): event is NavigationError => event instanceof NavigationError),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        if (this.isChunkLoadError(event.error)) {
          this.notificationService.warn(
            'Actualizando aplicacion',
            'Se detecto un recurso desactualizado. La pagina se recargara.'
          );
          this.safeReloadForChunkError();
          return;
        }

        console.error(event.error);
      });
  }

  private isNavigationEvent(event: Event): boolean {
    return (
      event instanceof NavigationStart ||
      event instanceof NavigationEnd ||
      event instanceof NavigationCancel ||
      event instanceof NavigationError
    );
  }

  private isChunkLoadError(error: unknown): boolean {
    const message =
      error instanceof Error
        ? `${error.name} ${error.message}`
        : typeof error === 'string'
          ? error
          : '';

    return (
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Importing a module script failed') ||
      message.includes('ChunkLoadError')
    );
  }

  private safeReloadForChunkError(): void {
    const storageKey = 'hotel-inventory-chunk-reload-attempt';
    const alreadyRetried = sessionStorage.getItem(storageKey) === '1';

    if (alreadyRetried) {
      this.uiStateService.reportIssue({
        kind: 'server',
        title: 'Actualizacion pendiente',
        detail:
          'La aplicacion detecto archivos desactualizados. Limpia la cache del navegador y vuelve a cargar la pagina.'
      });
      return;
    }

    sessionStorage.setItem(storageKey, '1');
    window.location.reload();
  }
}
