package com.hotel.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StockEntryRequest(
        @NotNull @Min(1) Integer quantity,
        @NotBlank String providerName,
        @Size(max = 500)
        String referenceText
) {}
