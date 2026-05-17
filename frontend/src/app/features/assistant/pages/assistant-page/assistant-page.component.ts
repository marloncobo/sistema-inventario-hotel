import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { AssistantApiService } from '@core/services/api/assistant-api.service';
import { extractApiErrorMessage } from '@models/api-error.model';
import type { InventoryAssistantHistoryEntry } from '@models/assistant.model';
import { INVENTORY_ASSISTANT_SUGGESTIONS } from '../../data/inventory-assistant-suggestions';

@Component({
  selector: 'app-assistant-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './assistant-page.component.html',
  styleUrls: [
    './assistant-page.component.css',
    '../../../../shared/styles/premium-panels.css'
  ]
})
export class AssistantPageComponent implements AfterViewChecked {
  private readonly assistantApi = inject(AssistantApiService);

  @ViewChild('chatThread') private chatThreadRef?: ElementRef<HTMLElement>;

  protected readonly question = signal('');
  protected readonly loading = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly history = signal<InventoryAssistantHistoryEntry[]>([]);
  protected readonly suggestedQuestions = signal(INVENTORY_ASSISTANT_SUGGESTIONS);

  private shouldScrollToBottom = false;

  protected readonly trimmedQuestion = computed(() => this.question().trim());
  protected readonly canSubmit = computed(
    () => this.trimmedQuestion().length > 0 && !this.loading()
  );
  protected readonly hasHistory = computed(() => this.history().length > 0);

  /** Sugerencias iniciales solo en el panel central (sin duplicar en el rail). */
  protected readonly starterPrompts = computed(() => this.suggestedQuestions());

  /** Atajos en el rail únicamente cuando ya hay mensajes en el chat. */
  protected readonly railQuickPrompts = computed(() =>
    this.hasHistory() ? this.suggestedQuestions() : []
  );

  private readonly promptIconClasses = [
    'pi-chart-bar',
    'pi-shopping-cart',
    'pi-exclamation-triangle',
    'pi-clock',
    'pi-list-check',
    'pi-bell',
    'pi-box',
    'pi-sync'
  ] as const;

  protected promptIcon(index: number): string {
    return this.promptIconClasses[index % this.promptIconClasses.length];
  }

  ngAfterViewChecked(): void {
    if (!this.shouldScrollToBottom) {
      return;
    }
    this.scrollToBottom();
    this.shouldScrollToBottom = false;
  }

  protected updateQuestion(value: string): void {
    this.question.set(value);
    if (this.submitError()) {
      this.submitError.set(null);
    }
  }

  protected onComposerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
      return;
    }
    event.preventDefault();
    this.askQuestion();
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

    this.history.update((entries) => [...entries, optimisticEntry]);
    this.shouldScrollToBottom = true;

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
          this.shouldScrollToBottom = true;
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
          this.shouldScrollToBottom = true;
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

  protected clearHistory(): void {
    if (this.loading()) {
      return;
    }
    this.history.set([]);
    this.submitError.set(null);
  }

  protected answerParagraphs(answer: string): string[] {
    const normalized = answer.trim();
    if (!normalized) {
      return [];
    }
    return normalized
      .split(/\n{2,}|\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
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

  private scrollToBottom(): void {
    const element = this.chatThreadRef?.nativeElement;
    if (!element) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  }

  private buildHistoryId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
