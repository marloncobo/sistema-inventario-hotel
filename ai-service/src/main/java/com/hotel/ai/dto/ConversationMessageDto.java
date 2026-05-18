package com.hotel.ai.dto;

import java.time.LocalDateTime;

public record ConversationMessageDto(
        Long id,
        String question,
        String answer,
        LocalDateTime createdAt,
        String userRole
) {
}
