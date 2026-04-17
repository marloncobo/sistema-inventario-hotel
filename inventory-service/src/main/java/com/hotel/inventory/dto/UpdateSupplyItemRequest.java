package com.hotel.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateSupplyItemRequest(
        @NotBlank @Size(max = 40) String code,
        @NotBlank @Size(max = 180) String name,
        @Size(max = 500)
        String description,
        String category,
        String unit,
        @Size(max = 180)
        String providerName,
        @NotNull @Min(0) Integer minStock,
        @Min(0) Integer maxStock,
        Boolean active
) {}
