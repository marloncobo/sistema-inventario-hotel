package com.hotel.rooms.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateRoomRequest(
        @NotBlank String number,
        @NotBlank String type,
        @NotBlank String status,
        @NotNull @Min(1) Integer floor
) {}