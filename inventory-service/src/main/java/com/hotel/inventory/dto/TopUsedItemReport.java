package com.hotel.inventory.dto;

public record TopUsedItemReport(
        Long itemId,
        String itemName,
        Long totalQuantity
) {}
