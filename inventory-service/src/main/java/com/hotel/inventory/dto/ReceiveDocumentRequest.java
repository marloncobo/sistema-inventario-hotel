package com.hotel.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * Registra la recepción de un documento (típicamente una orden de compra).
 * Las cantidades reales pueden diferir de las esperadas (recepción parcial).
 */
public record ReceiveDocumentRequest(
        Long toLocationId,
        @NotEmpty @Valid List<ReceiveLine> lines,
        @Size(max = 500) String notes
) {
    public record ReceiveLine(
            @NotNull Long lineId,
            @NotNull Integer quantityActual,
            BigDecimal unitCost
    ) {}
}
