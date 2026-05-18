package com.hotel.ai.dto;

public record InventoryAssistantResponse(String answer, String contextSource, String conversationTitle) {

    /** Constructor de compatibilidad hacia atrás (sin título) */
    public InventoryAssistantResponse(String answer, String contextSource) {
        this(answer, contextSource, null);
    }
}
