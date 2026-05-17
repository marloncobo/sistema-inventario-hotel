package com.hotel.ai.dto;

import java.io.Serializable;
import java.util.Set;

public record RoleContextInfo(
        Long userId,
        String username,
        String role,
        Set<String> permissions,
        boolean isAuthenticated
) implements Serializable {

    public boolean hasAccessToChatbot() {
        if (!isAuthenticated) {
            return false;
        }
        return "ADMIN".equals(role) || "ALMACENISTA".equals(role) ||
               "SERVICIO".equals(role) || "RECEPCION".equals(role);
    }

    public boolean hasPermission(String permission) {
        return permissions != null && permissions.contains(permission);
    }

    public static RoleContextInfo unauthenticated() {
        return new RoleContextInfo(null, null, null, Set.of(), false);
    }
}
