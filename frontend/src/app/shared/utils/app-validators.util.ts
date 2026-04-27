import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const notBlankValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || typeof value !== 'string') {
    return null;
  }

  return value.trim().length === 0 ? { blank: true } : null;
};

export const passwordStrengthValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return { passwordStrength: true };
  }

  const hasMinLength = value.length >= 8;
  const hasUppercase = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);

  return hasMinLength && hasUppercase && hasDigit ? null : { passwordStrength: true };
};
