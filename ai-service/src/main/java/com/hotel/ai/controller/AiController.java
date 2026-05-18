package com.hotel.ai.controller;

import com.hotel.ai.dto.ConversationDto;
import com.hotel.ai.dto.InventoryAssistantRequest;
import com.hotel.ai.dto.InventoryAssistantResponse;
import com.hotel.ai.dto.RoleContextInfo;
import com.hotel.ai.service.ConversationService;
import com.hotel.ai.service.InventoryAssistantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai")
public class AiController {
    private final InventoryAssistantService inventoryAssistantService;
    private final ConversationService conversationService;

    public AiController(InventoryAssistantService inventoryAssistantService,
                       ConversationService conversationService) {
        this.inventoryAssistantService = inventoryAssistantService;
        this.conversationService = conversationService;
    }

    @PostMapping("/inventory-assistant")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public InventoryAssistantResponse inventoryAssistant(
            @Valid @RequestBody InventoryAssistantRequest request,
            @RequestParam(required = false) Long conversationId) {

        RoleContextInfo roleContext = extractRoleContext();

        if (!roleContext.isAuthenticated()) {
            throw new IllegalStateException("Usuario no autenticado");
        }

        java.util.List<com.hotel.ai.dto.ConversationMessageDto> conversationHistory =
                conversationId == null || roleContext.userId() == null
                        ? java.util.List.of()
                        : conversationService.getConversation(conversationId, roleContext.userId())
                                .map(ConversationDto::messages)
                                .orElse(java.util.List.of());
        java.util.List<ConversationDto> relatedConversations =
                roleContext.userId() == null
                        ? java.util.List.of()
                        : conversationService.getRelatedConversationContext(roleContext.userId(), conversationId);

        InventoryAssistantResponse response = inventoryAssistantService.answerInventoryQuestion(
                request,
                roleContext,
                conversationHistory,
                relatedConversations
        );

        // Guardar en historial si se proporciona conversationId
        if (conversationId != null && roleContext.userId() != null) {
            conversationService.addMessageToConversation(
                    conversationId,
                    roleContext.userId(),
                    request.getQuestion(),
                    response.answer(),
                    roleContext.role()
            );
        }

        return response;
    }

    @GetMapping("/conversations")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public List<ConversationDto> getConversations() {
        RoleContextInfo roleContext = extractRoleContext();
        if (roleContext.userId() == null) {
            return List.of();
        }
        return conversationService.getUserConversations(roleContext.userId());
    }

    @GetMapping("/conversations/{id}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ConversationDto getConversation(@PathVariable Long id) {
        RoleContextInfo roleContext = extractRoleContext();
        if (roleContext.userId() == null) {
            throw new IllegalStateException("Usuario no autenticado");
        }
        return conversationService.getConversation(id, roleContext.userId())
                .orElseThrow(() -> new IllegalArgumentException("Conversación no encontrada"));
    }

    @PostMapping("/conversations")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ConversationDto createConversation(@RequestBody Map<String, String> body) {
        RoleContextInfo roleContext = extractRoleContext();
        if (roleContext.userId() == null) {
            throw new IllegalStateException("Usuario no autenticado");
        }
        String title = body.getOrDefault("title", "Nueva conversación");
        return conversationService.createConversation(roleContext.userId(), title);
    }

    @DeleteMapping("/conversations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("isAuthenticated()")
    public void deleteConversation(@PathVariable Long id) {
        RoleContextInfo roleContext = extractRoleContext();
        if (roleContext.userId() == null) {
            throw new IllegalStateException("Usuario no autenticado");
        }
        conversationService.deleteConversation(id, roleContext.userId());
    }

    @PutMapping("/conversations/{id}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ConversationDto updateConversationTitle(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        RoleContextInfo roleContext = extractRoleContext();
        if (roleContext.userId() == null) {
            throw new IllegalStateException("Usuario no autenticado");
        }
        String newTitle = body.get("title");
        conversationService.updateConversationTitle(id, roleContext.userId(), newTitle);
        return conversationService.getConversation(id, roleContext.userId())
                .orElseThrow(() -> new IllegalArgumentException("Conversación no encontrada"));
    }

    private RoleContextInfo extractRoleContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return RoleContextInfo.unauthenticated();
        }

        String username = authentication.getName();
        Long userId = null;

        // Extract userId from JWT token if available
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            Object userIdClaim = jwt.getClaim("userId");
            if (userIdClaim instanceof Number number) {
                userId = number.longValue();
            }
        }

        String userRole = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.substring(5))
                .findFirst()
                .orElse("RECEPCION");

        return new RoleContextInfo(
                userId,
                username,
                userRole,
                authentication.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(java.util.stream.Collectors.toSet()),
                true
        );
    }
}
