package com.hotel.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InitCountRequest(
        @NotNull Long locationId,
        @Size(max = 500) String notes
) {}
