import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { AssistantApiService } from '@core/services/api/assistant-api.service';
import { extractApiErrorMessage } from '@models/api-error.model';
import type { InventoryAssistantHistoryEntry } from '@models/assistant.model';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { INVENTORY_ASSISTANT_SUGGESTIONS } from '../../data/inventory-assistant-suggestions';

@Component({
  selector: 'app-assistant-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ProgressSpinnerModule,
    TagModule,
    EmptyStateComponent,
    PageHeaderComponent
  ],
  templateUrl: './assistant-page.component.html',
  styleUrls: [
    './assistant-page.component.css',
    '../../../../shared/styles/premium-panels.css'
  ]
})
export class AssistantPageComponent {
  private readonly assistantApi = inject(AssistantApiService);

  protected readonly question = signal('');
  protected readonly loading = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly history = signal<InventoryAssistantHistoryEntry[]>([]);
  protected readonly suggestedQuestions = signal(INVENTORY_ASSISTANT_SUGGESTIONS);

  protected readonly trimmedQuestion = computed(() => this.question().trim());
  protected readonly canSubmit = computed(
    () => this.trimmedQuestion().length > 0 && !this.loading()
  );
  protected readonly hasHistory = computed(() => this.history().length > 0);

  protected updateQuestion(value: string): void {
    this.question.set(value);
    if (this.submitError()) {
      this.submitError.set(null);
    }
  }

  protected askQuestion(questionOverride?: string): void {
    const nextQuestion = (questionOverride ?? this.question()).trim();
    if (!nextQuestion || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.submitError.set(null);
    this.question.set(questionOverride ? nextQuestion : '');

    const historyId = this.buildHistoryId();
    const optimisticEntry: InventoryAssistantHistoryEntry = {
      id: historyId,
      question: nextQuestion,
      answer: '',
      askedAt: new Date().toISOString(),
      status: 'loading',
      contextSource: null,
      errorMessage: null
    };

    this.history.update((entries) => [optimisticEntry, ...entries]);

    this.assistantApi
      .askInventoryAssistant(nextQuestion)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.history.update((entries) =>
            entries.map((entry) =>
              entry.id === historyId
                ? {
                    ...entry,
                    answer: response.answer,
                    contextSource: response.contextSource || null,
                    status: 'success'
                  }
                : entry
            )
          );
          this.loading.set(false);
        },
        error: (error) => {
          const message = extractApiErrorMessage(error?.error);
          this.submitError.set(message);
          this.history.update((entries) =>
            entries.map((entry) =>
              entry.id === historyId
                ? {
                    ...entry,
                    answer: '',
                    status: 'error',
                    errorMessage: message
                  }
                : entry
            )
          );
          this.loading.set(false);
        }
      });
  }

  protected useSuggestion(question: string): void {
    this.question.set(question);
    this.submitError.set(null);
  }

  protected resendQuestion(question: string): void {
    this.askQuestion(question);
  }

  protected trackByHistoryId(_: number, entry: InventoryAssistantHistoryEntry): string {
    return entry.id;
  }

  protected trackByQuestion(_: number, question: string): string {
    return question;
  }

  protected formatAskedAt(value: string): string {
    return new Date(value).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  private buildHistoryId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
