import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { AssistantApiService } from '@core/services/api/assistant-api.service';
import { AuthService } from '@core/services/auth.service';
import { ConversationApiService, ConversationDto } from '@core/services/api/conversation-api.service';
import { extractApiErrorMessage } from '@models/api-error.model';
import type { InventoryAssistantHistoryEntry } from '@models/assistant.model';
import {
  getSuggestionsForRole,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  QuestionSuggestion
} from '../../data/role-based-suggestions';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe';

@Component({
  selector: 'app-assistant-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, MarkdownPipe],
  templateUrl: './assistant-page.component.html',
  styleUrls: [
    './assistant-page.component.css',
    '../../../../shared/styles/premium-panels.css'
  ]
})
export class AssistantPageComponent implements AfterViewChecked, OnInit {
  private readonly assistantApi = inject(AssistantApiService);
  private readonly authService = inject(AuthService);
  private readonly conversationApi = inject(ConversationApiService);

  @ViewChild('chatThread') private chatThreadRef?: ElementRef<HTMLElement>;

  protected readonly question = signal('');
  protected readonly loading = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly history = signal<InventoryAssistantHistoryEntry[]>([]);
  protected readonly userRole = signal<string | null>(null);
  protected readonly suggestedQuestions = signal<QuestionSuggestion[]>([]);
  protected readonly conversations = signal<ConversationDto[]>([]);
  protected readonly currentConversationId = signal<number | null>(null);
  protected readonly currentConversationTitle = signal<string | null>(null);
  protected readonly isNewConversation = signal(false);
  protected readonly showConversationList = signal(false);
  protected readonly showHistory = signal(false);
  protected readonly convSidebarCollapsed = signal(true);
  protected readonly composerFocused = signal(false);

  private shouldScrollToBottom = false;

  protected readonly trimmedQuestion = computed(() => this.question().trim());
  protected readonly canSubmit = computed(
    () => this.trimmedQuestion().length > 0 && !this.loading()
  );
  protected readonly hasHistory = computed(() => this.history().length > 0);

  protected readonly starterPrompts = computed(() => this.suggestedQuestions());

  protected readonly railQuickPrompts = computed(() =>
    this.hasHistory() ? this.suggestedQuestions() : []
  );

  protected readonly roleDescription = computed(() => {
    const role = this.userRole();
    return role ? ROLE_DESCRIPTIONS[role] || 'Usuario' : 'Usuario';
  });

  protected readonly roleColor = computed(() => {
    const role = this.userRole();
    return role ? ROLE_COLORS[role] || '#95A5A6' : '#95A5A6';
  });

  ngOnInit(): void {
    const role = this.authService.primaryRole()?.toUpperCase() || 'RECEPCION';
    this.userRole.set(role);
    this.suggestedQuestions.set(getSuggestionsForRole(role));

    // Cargar conversaciones del usuario
    this.conversationApi.getConversations()
      .pipe(take(1))
      .subscribe({
        next: (conversations) => {
          this.conversations.set(conversations);
          // Si hay conversaciones previas, cargar la más reciente
          if (conversations.length > 0) {
            this.loadConversation(conversations[0].id);
          }
        },
        error: () => {
          // Silenciar errores de carga de conversaciones
        }
      });
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

    // Si no hay conversación abierta, crear una nueva
    let conversationId = this.currentConversationId();
    let isNewConv = false;
    if (!conversationId) {
      isNewConv = true;
      this.createNewConversation();
      conversationId = this.conversations()[0]?.id || null;
    }

    this.assistantApi
      .askInventoryAssistant(nextQuestion, conversationId || undefined)
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

          // Actualizar título con el generado por IA en el backend (estilo ChatGPT)
          if (response.conversationTitle && conversationId) {
            const aiTitle = response.conversationTitle;
            this.currentConversationTitle.set(aiTitle);
            this.isNewConversation.set(false);
            this.conversations.update((convs) =>
              convs.map((c) =>
                c.id === conversationId ? { ...c, title: aiTitle } : c
              )
            );
          }

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

  protected trackByQuestion(_: number, question: QuestionSuggestion): string {
    return question.text;
  }

  protected formatAskedAt(value: string): string {
    return new Date(value).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  protected createNewConversation(): void {
    // Crear conversación con título temporal
    const title = `Nueva conversación`;
    this.conversationApi.createConversation(title)
      .pipe(take(1))
      .subscribe({
        next: (conversation) => {
          // Agregar al inicio de la lista
          this.conversations.update(convs => [conversation, ...convs]);
          // Limpiar historial para nueva conversación
          this.history.set([]);
          this.currentConversationId.set(conversation.id);
          this.currentConversationTitle.set(conversation.title);
          this.isNewConversation.set(true);
          this.submitError.set(null);
          this.showConversationList.set(false);
        },
        error: () => {
          // Si falla, al menos limpia el historial
          this.history.set([]);
          this.currentConversationId.set(null);
          this.isNewConversation.set(true);
        }
      });
  }

  protected loadConversation(conversationId: number): void {
    this.currentConversationId.set(conversationId);
    this.isNewConversation.set(false);
    this.convSidebarCollapsed.set(true);
    this.conversationApi.getConversation(conversationId)
      .pipe(take(1))
      .subscribe({
        next: (conversation) => {
          this.currentConversationTitle.set(conversation.title);
          // Mapear mensajes guardados al formato de history
          const messages = conversation.messages.map(msg => ({
            id: `${msg.id}`,
            question: msg.question,
            answer: msg.answer,
            askedAt: msg.createdAt,
            status: 'success' as const,
            contextSource: null,
            errorMessage: null
          }));
          this.history.set(messages);
          this.submitError.set(null);
          this.shouldScrollToBottom = true;
        },
        error: () => {
          this.history.set([]);
          this.currentConversationId.set(null);
        }
      });
  }

  protected deleteConversation(conversationId: number): void {
    if (!confirm('¿Eliminar esta conversación?')) {
      return;
    }
    this.conversationApi.deleteConversation(conversationId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.conversations.update(convs =>
            convs.filter(c => c.id !== conversationId)
          );
          if (this.currentConversationId() === conversationId) {
            this.currentConversationId.set(null);
            this.history.set([]);
          }
        }
      });
  }

  protected toggleConversationList(): void {
    this.showConversationList.update(show => !show);
  }

  protected toggleHistoryPanel(): void {
    this.showHistory.update(show => !show);
  }

  protected toggleConvSidebar(): void {
    this.convSidebarCollapsed.update(collapsed => !collapsed);
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
