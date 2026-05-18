package com.hotel.ai.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ConversationDto(
        Long id,
        String title,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<ConversationMessageDto> messages
) {
}
