import { Directive, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input[type=number][appMinNumber]',
  standalone: true,
  host: {
    '[attr.min]': 'appMinNumber()',
    '[attr.step]': 'step()',
    inputmode: 'numeric'
  }
})
export class MinNumberDirective {
  readonly appMinNumber = input(0);
  readonly step = input(1);

  private readonly ngControl = inject(NgControl, { self: true, optional: true });

  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === 'Subtract') {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  protected onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text')?.trim() ?? '';
    if (!text) {
      return;
    }

    const value = Number(text.replace(',', '.'));
    if (text.includes('-') || (!Number.isNaN(value) && value < this.appMinNumber())) {
      event.preventDefault();
    }
  }

  @HostListener('input', ['$event'])
  protected onInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.enforceMinimum(target);
  }

  private enforceMinimum(target: HTMLInputElement): void {
    const rawValue = target.value?.trim();
    if (!rawValue || rawValue === '-') {
      return;
    }

    const parsed = Number(rawValue);
    if (Number.isNaN(parsed) || parsed >= this.appMinNumber()) {
      return;
    }

    const nextValue = this.appMinNumber();
    target.value = `${nextValue}`;
    this.ngControl?.control?.setValue(nextValue);
  }
}
