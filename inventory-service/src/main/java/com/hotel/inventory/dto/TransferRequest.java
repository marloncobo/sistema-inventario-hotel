package com.hotel.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record TransferRequest(
        @NotNull Long itemId,
        @NotNull Long fromLocationId,
        @NotNull Long toLocationId,
        @NotNull @DecimalMin(value = "0.001", inclusive = true) BigDecimal quantity,
        @Size(max = 120) String operationalResponsible,
        @Size(max = 500) String referenceText
) {}
