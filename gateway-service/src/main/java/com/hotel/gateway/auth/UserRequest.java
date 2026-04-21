package com.hotel.gateway.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UserRequest(
        @NotBlank String username,
        String password,
        @NotEmpty List<String> roles,
        Boolean active
) {}
