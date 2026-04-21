package com.hotel.gateway.auth;

import java.time.Instant;
import java.util.List;

public record LoginResponse(String token, String tokenType, Instant expiresAt, String username, List<String> roles) {
}
