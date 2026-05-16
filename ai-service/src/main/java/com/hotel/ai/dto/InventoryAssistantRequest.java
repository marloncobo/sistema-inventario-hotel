package com.hotel.ai.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

public class InventoryAssistantRequest {
    @NotBlank(message = "La pregunta no puede estar vacia")
    private String question;

    @Valid
    private InventoryContextDto inventoryContext;

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public InventoryContextDto getInventoryContext() {
        return inventoryContext;
    }

    public void setInventoryContext(InventoryContextDto inventoryContext) {
        this.inventoryContext = inventoryContext;
    }
}
