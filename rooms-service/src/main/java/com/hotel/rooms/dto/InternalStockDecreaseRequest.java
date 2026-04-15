package com.hotel.rooms.dto;

public record InternalStockDecreaseRequest(
        Long itemId,
        Integer quantity,
        String roomNumber,
        String referenceText
) {}