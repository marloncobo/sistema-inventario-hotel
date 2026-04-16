package com.hotel.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StockReturnRequest(
        @NotNull @Min(1) Integer quantity,
        String roomNumber,
        String areaName,
        @NotBlank String responsible,
        String referenceText
) {}
