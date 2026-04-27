package com.hotel.rooms.dto;

public record RoomConsumptionReport(
        String roomNumber,
        String roomType,
        Long itemId,
        String itemName,
        String assignmentType,
        String deliveredBy,
        Long totalQuantity
) {}
