package com.hotel.ai.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

public record ConversationDto(
        Long id,
        String title,
        @JsonFormat(
                shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING,
                pattern = "yyyy-MM-dd'T'HH:mm:ss",
                timezone = "America/Bogota"
        )
        LocalDateTime createdAt,
        @JsonFormat(
                shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING,
                pattern = "yyyy-MM-dd'T'HH:mm:ss",
                timezone = "America/Bogota"
        )
        LocalDateTime updatedAt,
        List<ConversationMessageDto> messages
) {
}
