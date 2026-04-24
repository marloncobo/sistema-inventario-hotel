import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import type { AppRole } from '@models/role.model';

function readRoles(route: ActivatedRouteSnapshot): AppRole[] {
  return (route.data['roles'] as AppRole[] | undefined) ?? [];
}

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = readRoles(route);

  if (!requiredRoles.length) {
    return router.createUrlTree(['/dashboard']);
  }

  if (!authService.hasAnyRole(requiredRoles)) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
