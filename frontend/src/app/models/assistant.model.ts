export interface InventoryAssistantRequest {
  question: string;
}

export interface InventoryAssistantResponse {
  answer: string;
  contextSource: string;
  /** Título generado automáticamente por IA tras el primer mensaje de la conversación */
  conversationTitle?: string | null;
}

export type InventoryAssistantHistoryStatus = 'loading' | 'success' | 'error';

export interface InventoryAssistantHistoryEntry {
  id: string;
  question: string;
  answer: string;
  askedAt: string;
  status: InventoryAssistantHistoryStatus;
  contextSource: string | null;
  errorMessage: string | null;
}
