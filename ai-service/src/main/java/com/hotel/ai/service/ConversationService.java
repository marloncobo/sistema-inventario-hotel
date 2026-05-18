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

    public ConversationService(ConversationRepository conversationRepository) {
        this.conversationRepository = conversationRepository;
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
                    conversationRepository.save(conversation);
                });
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
