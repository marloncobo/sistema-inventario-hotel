import { AbstractControl, FormGroup } from '@angular/forms';

function markServerError(control: AbstractControl, message: string): void {
  control.setErrors({
    ...(control.errors ?? {}),
    server: message
  });
  control.markAsTouched();
}

export function applyServerValidationErrors(
  form: FormGroup,
  errors: Record<string, string>
): void {
  Object.entries(errors).forEach(([field, message]) => {
    const control = form.get(field);
    if (!control) {
      return;
    }

    markServerError(control, message);
  });
}
