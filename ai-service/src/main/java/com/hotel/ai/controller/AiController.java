package com.hotel.ai.controller;

import com.hotel.ai.dto.InventoryAssistantRequest;
import com.hotel.ai.dto.InventoryAssistantResponse;
import com.hotel.ai.service.InventoryAssistantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {
    private final InventoryAssistantService inventoryAssistantService;

    public AiController(InventoryAssistantService inventoryAssistantService) {
        this.inventoryAssistantService = inventoryAssistantService;
    }

    @PostMapping("/inventory-assistant")
    @ResponseStatus(HttpStatus.OK)
    public InventoryAssistantResponse inventoryAssistant(@Valid @RequestBody InventoryAssistantRequest request) {
        return inventoryAssistantService.answerInventoryQuestion(request);
    }
}
