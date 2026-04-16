package com.hotel.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateSupplyItemRequest(
        @NotBlank String code,
        @NotBlank String name,
        String description,
        String category,
        String unit,
        String providerName,
        @NotNull @Min(0) Integer minStock,
        @Min(0) Integer maxStock,
        Boolean active
) {}
