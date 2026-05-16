package com.hotel.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateLocationRequest(
        @NotBlank @Size(max = 60) String code,
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 30) String type,
        Long parentLocationId,
        @Size(max = 10) String roomNumber,
        @Size(max = 300) String description,
        Boolean active
) {}
