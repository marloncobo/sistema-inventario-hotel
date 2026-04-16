package com.hotel.rooms.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateRoomStatusRequest(
        @NotBlank String status
) {}
