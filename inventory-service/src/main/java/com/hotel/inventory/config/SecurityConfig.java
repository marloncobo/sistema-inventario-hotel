package com.hotel.inventory.config;

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
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.spec.SecretKeySpec;
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
                        .requestMatchers(HttpMethod.GET, "/api/inventory/reports/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/inventory/audit").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/inventory/alerts/**").hasAnyRole("ADMIN", "ALMACENISTA")
                        .requestMatchers("/api/inventory/catalogs/providers/**").hasAnyRole("ADMIN", "ALMACENISTA")
                        .requestMatchers("/api/inventory/catalogs/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/inventory/items/*/deactivate").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/inventory/items/*/returns").hasAnyRole("ADMIN", "ALMACENISTA", "SERVICIO")
                        .requestMatchers(HttpMethod.POST, "/api/inventory/internal/items/decrease").hasAnyRole("ADMIN", "ALMACENISTA", "SERVICIO")
                        .requestMatchers(HttpMethod.GET, "/api/inventory/items", "/api/inventory/items/*", "/api/inventory/items/low-stock").hasAnyRole("ADMIN", "ALMACENISTA", "SERVICIO")
                        .requestMatchers(HttpMethod.GET, "/api/inventory/movements").hasAnyRole("ADMIN", "ALMACENISTA")
                        .requestMatchers("/api/inventory/**").hasAnyRole("ADMIN", "ALMACENISTA")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .build();
    }

    @Bean
    JwtDecoder jwtDecoder(@Value("${security.jwt.secret}") String secret) {
        SecretKeySpec key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(key).build();
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
}
