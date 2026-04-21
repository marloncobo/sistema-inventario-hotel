import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import type { AppRole } from '@models/role.model';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);
  private isVisible = false;

  readonly appHasRole = input.required<AppRole | AppRole[]>();

  constructor() {
    effect(() => {
      const expected = this.appHasRole();
      const roles = Array.isArray(expected) ? expected : [expected];
      const canView = this.authService.hasAnyRole(roles);

      if (canView && !this.isVisible) {
        this.viewContainerRef.createEmbeddedView(this.templateRef);
        this.isVisible = true;
      }

      if (!canView && this.isVisible) {
        this.viewContainerRef.clear();
        this.isVisible = false;
      }
    });
  }
}
