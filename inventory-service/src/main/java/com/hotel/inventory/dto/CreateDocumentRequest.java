package com.hotel.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * Crea un documento multi-ítem (orden de compra, transferencia, ajuste, etc.).
 *
 * Para ORDEN_COMPRA: providerName obligatorio, toLocationId opcional (default Bodega Principal).
 * Para TRANSFERENCIA: fromLocationId y toLocationId obligatorios.
 * Para AJUSTE/CONTEO: toLocationId (la ubicación a ajustar).
 */
public record CreateDocumentRequest(
        @NotBlank @Size(max = 30) String type,
        @Size(max = 120) String providerName,
        Long fromLocationId,
        Long toLocationId,
        @Size(max = 500) String notes,
        @NotEmpty @Valid List<DocumentLineRequest> lines
) {
    public record DocumentLineRequest(
            @NotNull Long itemId,
            @NotNull Integer quantityExpected,
            BigDecimal unitCost,
            @Size(max = 300) String notes
    ) {}
}
