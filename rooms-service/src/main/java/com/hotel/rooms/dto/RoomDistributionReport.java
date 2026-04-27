package com.hotel.rooms.dto;

import java.time.LocalDateTime;

public record RoomDistributionReport(
        String roomNumber,
        String roomType,
        Long itemId,
        String itemName,
        Integer quantity,
        String assignmentType,
        String deliveredBy,
        String guestName,
        LocalDateTime deliveredAt
) {}
