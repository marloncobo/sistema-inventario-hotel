package com.hotel.rooms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.spec.SecretKeySpec;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/rooms/reports/*/export").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/rooms/reports/**").hasAnyRole("ADMIN", "RECEPCION")
                        .requestMatchers(HttpMethod.GET, "/api/rooms/audit").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/rooms").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/rooms/*/status").hasAnyRole("ADMIN", "RECEPCION")
                        .requestMatchers(HttpMethod.POST, "/api/rooms/*/supplies/assign").hasAnyRole("ADMIN", "ALMACENISTA", "SERVICIO")
                        .requestMatchers(HttpMethod.GET, "/api/rooms/number/**").hasAnyRole("ADMIN", "ALMACENISTA", "RECEPCION", "SERVICIO")
                        .requestMatchers(HttpMethod.GET, "/api/rooms", "/api/rooms/*", "/api/rooms/*/supplies", "/api/rooms/supplies").hasAnyRole("ADMIN", "ALMACENISTA", "RECEPCION")
                        .requestMatchers("/api/rooms/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .bearerTokenResolver(bearerTokenResolver())
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .build();
    }

    @Bean
    JwtDecoder jwtDecoder(@Value("${security.jwt.secret}") String secret) {
        SecretKeySpec key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(key).build();
    }

    @Bean
    BearerTokenResolver bearerTokenResolver() {
        return request -> tokenFromHeader(request, "Authorization", "X-Forwarded-Authorization");
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthoritiesClaimName("roles");
        authoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter authenticationConverter = new JwtAuthenticationConverter();
        authenticationConverter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
        return authenticationConverter;
    }

    private String tokenFromHeader(HttpServletRequest request, String... headerNames) {
        for (String headerName : headerNames) {
            String value = request.getHeader(headerName);
            if (value == null || value.isBlank()) {
                continue;
            }
            if (value.regionMatches(true, 0, "Bearer ", 0, 7)) {
                return value.substring(7);
            }
            return value;
        }
        return null;
    }
}
