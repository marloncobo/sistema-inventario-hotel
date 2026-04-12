package com.lunara.identity.dto;

import com.lunara.identity.model.UserStatus;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public final class IdentityDtos {

    private IdentityDtos() {
    }

    public static class LoginRequest {
        @NotBlank
        private String username;
        @NotBlank
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class LoginResponse {
        private String token;
        private String username;
        private String role;
        private String fullName;

        public LoginResponse(String token, String username, String role, String fullName) {
            this.token = token;
            this.username = username;
            this.role = role;
            this.fullName = fullName;
        }

        public String getToken() {
            return token;
        }

        public String getUsername() {
            return username;
        }

        public String getRole() {
            return role;
        }

        public String getFullName() {
            return fullName;
        }
    }

    public static class RoleRequest {
        @NotBlank
        private String name;
        @NotBlank
        private String description;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }

    public static class UserRequest {
        @NotBlank
        private String fullName;
        @NotBlank
        @Email
        private String email;
        @NotBlank
        private String username;
        @NotBlank
        private String password;
        @NotNull
        private Long roleId;

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public Long getRoleId() {
            return roleId;
        }

        public void setRoleId(Long roleId) {
            this.roleId = roleId;
        }
    }

    public static class UserStatusRequest {
        @NotNull
        private UserStatus status;

        public UserStatus getStatus() {
            return status;
        }

        public void setStatus(UserStatus status) {
            this.status = status;
        }
    }
}
