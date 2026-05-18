package com.hotel.ai.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public record ConversationMessageDto(
        Long id,
        String question,
        String answer,
        @JsonFormat(
                shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING,
                pattern = "yyyy-MM-dd'T'HH:mm:ss",
                timezone = "America/Bogota"
        )
        LocalDateTime createdAt,
        String userRole
) {
}
