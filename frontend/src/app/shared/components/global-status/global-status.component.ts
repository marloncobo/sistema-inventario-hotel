import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { UiStateService } from '@core/services/ui/ui-state.service';

@Component({
  selector: 'app-global-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (uiStateService.isBusy()) {
      <div class="global-progress" aria-hidden="true">
        <span class="global-progress__bar"></span>
      </div>

      <aside class="global-busy-pill">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Sincronizando informacion</span>
      </aside>
    }

    @if (uiStateService.globalIssue(); as issue) {
      <aside class="global-issue" [attr.data-kind]="issue.kind" role="status" aria-live="polite">
        <div class="global-issue__copy">
          <strong>{{ issue.title }}</strong>
          <p>{{ issue.detail }}</p>
        </div>

        <button type="button" class="global-issue__close" (click)="uiStateService.clearIssue()">
          Cerrar
        </button>
      </aside>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .global-progress {
      position: fixed;
      inset: 0 0 auto;
      z-index: 2000;
      height: 0.26rem;
      overflow: hidden;
      background: rgba(226, 232, 240, 0.6);
      backdrop-filter: blur(12px);
    }

    .global-progress__bar {
      display: block;
      width: 40%;
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #14b8a6, #0ea5e9, #38bdf8);
      animation: global-progress-slide 1.15s ease-in-out infinite;
    }

    .global-busy-pill {
      position: fixed;
      right: 1.5rem;
      bottom: 1.5rem;
      z-index: 1900;
      display: inline-flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.85rem 1rem;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.92);
      color: white;
      box-shadow: 0 24px 45px rgba(15, 23, 42, 0.22);
      font-size: 0.88rem;
    }

    .global-issue {
      position: fixed;
      top: 1rem;
      left: 50%;
      z-index: 1950;
      width: min(44rem, calc(100vw - 2rem));
      transform: translateX(-50%);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.15rem;
      border-radius: 1.25rem;
      border: 1px solid rgba(248, 113, 113, 0.28);
      background: rgba(255, 255, 255, 0.98);
      box-shadow: 0 28px 60px rgba(15, 23, 42, 0.16);
    }

    .global-issue[data-kind='offline'] {
      border-color: rgba(249, 115, 22, 0.28);
      background: rgba(255, 251, 235, 0.98);
    }

    .global-issue__copy strong {
      display: block;
      color: #7c2d12;
      font-size: 0.96rem;
    }

    .global-issue__copy p {
      margin: 0.25rem 0 0;
      color: #9a3412;
      font-size: 0.88rem;
      line-height: 1.5;
    }

    .global-issue__close {
      border: 0;
      background: transparent;
      color: #9a3412;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    @keyframes global-progress-slide {
      0% {
        transform: translateX(-140%);
      }

      100% {
        transform: translateX(320%);
      }
    }

    @media (max-width: 767px) {
      .global-busy-pill {
        right: 1rem;
        bottom: 1rem;
        left: 1rem;
        justify-content: center;
      }

      .global-issue {
        top: 0.75rem;
        width: calc(100vw - 1rem);
        padding: 0.95rem 1rem;
      }
    }
  `
})
export class GlobalStatusComponent {
  protected readonly uiStateService = inject(UiStateService);
}
