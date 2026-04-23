package com.hotel.gateway.auth;

import java.util.List;

public record UserResponse(
        Long id,
        String username,
        String email,
        List<String> roles,
        Boolean active
) {
    static UserResponse from(AppUser user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRoles(), user.getActive());
    }
}
