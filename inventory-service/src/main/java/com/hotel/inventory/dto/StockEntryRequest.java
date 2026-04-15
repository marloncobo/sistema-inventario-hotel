package com.hotel.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StockEntryRequest(
        @NotNull @Min(1) Integer quantity,
        String referenceText
) {}