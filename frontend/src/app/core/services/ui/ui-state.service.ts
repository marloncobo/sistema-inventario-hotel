import { computed, Injectable, signal } from '@angular/core';

export interface GlobalIssue {
  kind: 'offline' | 'server';
  title: string;
  detail: string;
}

@Injectable({ providedIn: 'root' })
export class UiStateService {
  private readonly pendingRequests = signal(0);
  private readonly navigatingState = signal(false);
  private readonly globalIssueState = signal<GlobalIssue | null>(null);

  readonly navigating = computed(() => this.navigatingState());
  readonly hasPendingRequests = computed(() => this.pendingRequests() > 0);
  readonly isBusy = computed(() => this.hasPendingRequests() || this.navigating());
  readonly globalIssue = computed(() => this.globalIssueState());

  beginRequest(): void {
    this.pendingRequests.update((count) => count + 1);
  }

  endRequest(): void {
    this.pendingRequests.update((count) => Math.max(0, count - 1));
  }

  setNavigating(value: boolean): void {
    this.navigatingState.set(value);
  }

  reportIssue(issue: GlobalIssue): boolean {
    const current = this.globalIssueState();
    if (
      current?.kind === issue.kind &&
      current.title === issue.title &&
      current.detail === issue.detail
    ) {
      return false;
    }

    this.globalIssueState.set(issue);
    return true;
  }

  clearIssue(): void {
    this.globalIssueState.set(null);
  }
}
