package com.hotel.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StockReturnRequest(
        @NotNull @Min(1) Integer quantity,
        @Pattern(regexp = "\\d{3}", message = "El numero de habitacion debe tener 3 digitos")
        String roomNumber,
        String areaName,
        @Size(max = 120)
        String operationalResponsible,
        @Size(max = 500)
        String referenceText,
        Long sourceMovementId
) {}
