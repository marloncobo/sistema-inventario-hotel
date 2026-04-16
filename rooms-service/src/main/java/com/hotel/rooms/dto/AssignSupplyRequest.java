package com.hotel.rooms.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AssignSupplyRequest(
        @NotNull Long itemId,
        @NotNull @Min(1) Integer quantity,
        @NotBlank String deliveredBy,
        String guestName,
        String assignmentType
) {}
