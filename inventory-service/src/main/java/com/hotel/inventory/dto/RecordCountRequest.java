package com.hotel.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record RecordCountRequest(
        @NotEmpty @Valid List<CountLine> lines,
        String notes
) {
    public record CountLine(
            @NotNull Long lineId,
            @NotNull Integer quantityActual
    ) {}
}
