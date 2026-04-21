package com.hotel.inventory.dto;

import jakarta.validation.constraints.NotBlank;

public record VoidMovementRequest(
        @NotBlank String reason
) {}
