package com.hotel.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateSupplyItemRequest(
        @NotBlank String name,
        String category,
        String unit,
        @NotNull @Min(0) Integer stock,
        @NotNull @Min(0) Integer minStock
) {}