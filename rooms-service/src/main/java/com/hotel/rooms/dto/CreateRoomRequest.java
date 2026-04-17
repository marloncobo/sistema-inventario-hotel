package com.hotel.rooms.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateRoomRequest(
        @NotBlank @Pattern(regexp = "\\d{3}", message = "El numero de habitacion debe tener 3 digitos") String number,
        @NotBlank String type,
        @NotBlank String status,
        @NotNull @Min(1) Integer capacity,
        @NotNull @Min(1) Integer floor,
        @Size(max = 500)
        String observations
) {}
