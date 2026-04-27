package com.hotel.inventory.dto;

public record RoomValidationResponse(
        Long id,
        String number,
        String type,
        String status,
        Boolean active
) {}
