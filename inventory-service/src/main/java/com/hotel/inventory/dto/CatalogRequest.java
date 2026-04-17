package com.hotel.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record CatalogRequest(
        @NotBlank @Size(max = 40) String code,
        @NotBlank @Size(max = 180) String name,
        @Size(max = 20) String abbreviation,
        @Size(max = 40) String documentNumber,
        @Size(max = 40) String phone,
        @Email @Size(max = 180) String email,
        Boolean active
) {}
