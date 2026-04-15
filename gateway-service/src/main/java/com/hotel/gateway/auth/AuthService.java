package com.hotel.gateway.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
public class AuthService {
    private final JwtEncoder jwtEncoder;
    private final PasswordEncoder passwordEncoder;
    private final long expirationMinutes;
    private final Map<String, AppUser> users;

    public AuthService(
            JwtEncoder jwtEncoder,
            PasswordEncoder passwordEncoder,
            @Value("${security.jwt.expiration-minutes:120}") long expirationMinutes
    ) {
        this.jwtEncoder = jwtEncoder;
        this.passwordEncoder = passwordEncoder;
        this.expirationMinutes = expirationMinutes;
        this.users = Map.of(
                "admin", new AppUser("admin", passwordEncoder.encode("admin123"), List.of("ADMIN")),
                "usuario", new AppUser("usuario", passwordEncoder.encode("user123"), List.of("USER"))
        );
    }

    public LoginResponse login(LoginRequest request) {
        if (request == null || request.username() == null || request.password() == null) {
            throw new InvalidCredentialsException();
        }

        AppUser user = users.get(request.username());
        if (user == null || !passwordEncoder.matches(request.password(), user.password())) {
            throw new InvalidCredentialsException();
        }

        Instant now = Instant.now();
        Instant expiresAt = now.plus(expirationMinutes, ChronoUnit.MINUTES);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("hotel-inventory-gateway")
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(user.username())
                .claim("roles", user.roles())
                .build();

        String token = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
        return new LoginResponse(token, "Bearer", expiresAt, user.username(), user.roles());
    }

    private record AppUser(String username, String password, List<String> roles) {
    }
}
