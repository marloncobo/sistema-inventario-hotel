package com.hotel.rooms.dto;

public record InternalStockDecreaseRequest(
        Long itemId,
        Integer quantity,
        String roomNumber,
        String areaName,
        String origin,
        String responsible,
        String referenceText
) {}
