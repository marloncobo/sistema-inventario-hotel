package com.hotel.inventory.dto;

public record RoomValidationResponse(
        String number,
        String type,
        String status,
        Boolean active
) {}
