package com.hotel.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record InternalStockDecreaseRequest(
        @NotNull Long itemId,
        @NotNull @Min(1) Integer quantity,
        String roomNumber,
        String referenceText
) {}