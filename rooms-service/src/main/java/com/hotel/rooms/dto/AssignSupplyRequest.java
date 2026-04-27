package com.hotel.rooms.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AssignSupplyRequest(
        @NotNull Long itemId,
        @NotNull @Min(1) Integer quantity,
        @NotBlank @Size(max = 120) String deliveredBy,
        @Size(max = 120)
        String guestName,
        String assignmentType
) {}
