package com.hotel.rooms.dto;

public record StockChangeResponse(
        Long itemId,
        String itemName,
        Integer remainingStock,
        String message
) {}