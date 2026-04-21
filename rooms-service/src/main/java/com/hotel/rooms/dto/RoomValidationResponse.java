package com.hotel.rooms.dto;

public record RoomValidationResponse(
        String number,
        String type,
        String status,
        Boolean active
) {}
