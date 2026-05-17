package com.hotel.ai.controller;

import com.hotel.ai.dto.InventoryAssistantRequest;
import com.hotel.ai.dto.InventoryAssistantResponse;
import com.hotel.ai.dto.RoleContextInfo;
import com.hotel.ai.service.InventoryAssistantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
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
    @PreAuthorize("isAuthenticated()")
    public InventoryAssistantResponse inventoryAssistant(
            @Valid @RequestBody InventoryAssistantRequest request) {

        RoleContextInfo roleContext = extractRoleContext();

        if (!roleContext.isAuthenticated()) {
            throw new IllegalStateException("Usuario no autenticado");
        }

        if (!roleContext.hasAccessToChatbot()) {
            throw new IllegalStateException(
                    "Tu rol (" + roleContext.role() + ") no tiene acceso al asistente IA");
        }

        return inventoryAssistantService.answerInventoryQuestion(request, roleContext);
    }

    private RoleContextInfo extractRoleContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return RoleContextInfo.unauthenticated();
        }

        String username = authentication.getName();

        String userRole = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.substring(5))
                .findFirst()
                .orElse("RECEPCION");

        return new RoleContextInfo(
                null,
                username,
                userRole,
                authentication.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(java.util.stream.Collectors.toSet()),
                true
        );
    }
}
