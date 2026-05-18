package com.hotel.ai.service;

import com.hotel.ai.dto.ConversationDto;
import com.hotel.ai.dto.ConversationMessageDto;
import com.hotel.ai.model.Conversation;
import com.hotel.ai.model.ConversationMessage;
import com.hotel.ai.repository.ConversationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ConversationService {
    private static final int RELATED_CONVERSATIONS_LIMIT = 4;
    private final ConversationRepository conversationRepository;
    private final GeminiClient geminiClient;

    public ConversationService(ConversationRepository conversationRepository, GeminiClient geminiClient) {
        this.conversationRepository = conversationRepository;
        this.geminiClient = geminiClient;
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getUserConversations(Long userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<ConversationDto> getConversation(Long conversationId, Long userId) {
        return conversationRepository.findByIdAndUserId(conversationId, userId)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getRelatedConversationContext(Long userId, Long activeConversationId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .filter(conversation -> activeConversationId == null || !conversation.getId().equals(activeConversationId))
                .limit(RELATED_CONVERSATIONS_LIMIT)
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ConversationDto createConversation(Long userId, String title) {
        Conversation conversation = new Conversation(userId, title);
        Conversation saved = conversationRepository.save(conversation);
        return toDto(saved);
    }

    @Transactional
    public void deleteConversation(Long conversationId, Long userId) {
        conversationRepository.deleteByIdAndUserId(conversationId, userId);
    }

    @Transactional
    public void updateConversationTitle(Long conversationId, Long userId, String newTitle) {
        conversationRepository.findByIdAndUserId(conversationId, userId)
                .ifPresent(conversation -> {
                    conversation.setTitle(newTitle);
                    conversationRepository.save(conversation);
                });
    }

    @Transactional
    public void addMessageToConversation(Long conversationId, Long userId,
                                        String question, String answer, String userRole) {
        conversationRepository.findByIdAndUserId(conversationId, userId)
                .ifPresent(conversation -> {
                    ConversationMessage message = new ConversationMessage(question, answer, userRole);
                    conversation.addMessage(message);

                    // Si es el primer mensaje y el título es genérico, generar uno con IA (estilo ChatGPT)
                    if (conversation.getMessages().size() == 1 && isGenericTitle(conversation.getTitle())) {
                        String aiTitle = geminiClient.generateConversationTitle(question, answer);
                        String autoTitle = (aiTitle != null && !aiTitle.isBlank())
                                ? aiTitle
                                : generateTitleFromQuestion(question);
                        conversation.setTitle(autoTitle);
                    }

                    conversationRepository.save(conversation);
                });
    }

    /**
     * Verifica si el título es genérico (auto-generado por el sistema)
     */
    private boolean isGenericTitle(String title) {
        if (title == null) {
            return true;
        }
        String lowerTitle = title.toLowerCase().trim();
        return lowerTitle.equals("nueva conversación") ||
               lowerTitle.equals("new conversation") ||
               lowerTitle.isEmpty();
    }

    /**
     * Genera un título automático a partir de la pregunta del usuario
     * Similar al comportamiento de ChatGPT
     */
    private String generateTitleFromQuestion(String question) {
        if (question == null || question.trim().isEmpty()) {
            return "Nueva conversación";
        }

        String cleaned = question.trim();

        // Eliminar caracteres especiales y palabras vacías
        cleaned = cleaned.replaceAll("[¿?¡!]", "").trim();

        // Si la pregunta es muy corta, devolverla tal cual
        if (cleaned.length() <= 50) {
            return capitalizeFirstLetter(cleaned);
        }

        // Si es más larga, tomar las primeras palabras significativas
        String[] words = cleaned.split("\\s+");
        StringBuilder title = new StringBuilder();
        int wordCount = 0;

        for (String word : words) {
            // Saltar palabras muy cortas (artículos, preposiciones)
            if (word.length() > 2 || wordCount == 0) {
                if (title.length() + word.length() > 50) {
                    break;
                }
                if (title.length() > 0) {
                    title.append(" ");
                }
                title.append(word);
                wordCount++;
            }

            if (wordCount >= 5) {
                break;
            }
        }

        String result = title.toString().trim();
        if (result.isEmpty()) {
            return "Nueva conversación";
        }

        // Agregar "..." si se cortó
        if (cleaned.length() > result.length() + 20) {
            result += "...";
        }

        return capitalizeFirstLetter(result);
    }

    /**
     * Capitaliza la primera letra de una cadena
     */
    private String capitalizeFirstLetter(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        return text.substring(0, 1).toUpperCase() + text.substring(1);
    }

    private ConversationDto toDto(Conversation conversation) {
        List<ConversationMessageDto> messages = conversation.getMessages()
                .stream()
                .map(msg -> new ConversationMessageDto(
                        msg.getId(),
                        msg.getQuestion(),
                        msg.getAnswer(),
                        msg.getCreatedAt(),
                        msg.getUserRole()
                ))
                .toList();

        return new ConversationDto(
                conversation.getId(),
                conversation.getTitle(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt(),
                messages
        );
    }
}
