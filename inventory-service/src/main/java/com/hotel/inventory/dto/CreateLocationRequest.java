package com.hotel.inventory.dto;

import jakarta.validation.constraints.Size;

public record CreateLocationRequest(
        @Size(max = 60) String code,
        @jakarta.validation.constraints.NotBlank @Size(max = 120) String name,
        @jakarta.validation.constraints.NotBlank @Size(max = 30) String type,
        Long parentLocationId,
        @Size(max = 10) String roomNumber,
        @Size(max = 300) String description,
        Boolean active
) {}
