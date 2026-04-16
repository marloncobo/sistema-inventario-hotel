package com.hotel.gateway.auth;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthServiceTest {
    private static final String SECRET = "hotel-inventory-demo-secret-key-32";

    private final AuthService authService = new AuthService(
            new NimbusJwtEncoder(new ImmutableSecret<>(SECRET.getBytes(StandardCharsets.UTF_8))),
            new BCryptPasswordEncoder(),
            120
    );

    @Test
    void loginReturnsBearerTokenForValidCredentials() {
        LoginResponse response = authService.login(new LoginRequest("admin", "admin123"));

        assertThat(response.token()).isNotBlank();
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.username()).isEqualTo("admin");
        assertThat(response.roles()).containsExactly("ADMIN");
        assertThat(response.expiresAt()).isNotNull();
    }

    @Test
    void loginRejectsInvalidCredentials() {
        assertThatThrownBy(() -> authService.login(new LoginRequest("admin", "wrong")))
                .isInstanceOf(InvalidCredentialsException.class);
    }
}
