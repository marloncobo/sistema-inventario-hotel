package com.hotel.rooms.dto;

public record InventoryItemResponse(
        Long id,
        String code,
        String name,
        String category,
        String unit,
        Integer stock,
        Boolean active
) {}
