package com.hotel.inventory.dto;

public record StockChangeResponse(
        Long itemId,
        String itemName,
        Integer remainingStock,
        String message
) {}