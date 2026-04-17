package com.hotel.gateway.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import reactor.core.publisher.Flux;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {
    @Bean
    SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers("/auth/login", "/actuator/health", "/actuator/info").permitAll()
                        .pathMatchers("/auth/users/**", "/auth/audit").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.GET, "/inventory/api/inventory/reports/**", "/inventory/api/inventory/audit", "/rooms/api/rooms/audit").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.GET, "/inventory/api/inventory/alerts/**").hasAnyRole("ADMIN", "ALMACENISTA")
                        .pathMatchers(HttpMethod.GET, "/rooms/api/rooms/reports/*/export").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.GET, "/rooms/api/rooms/reports/**").hasAnyRole("ADMIN", "RECEPCION")
                        .pathMatchers("/inventory/api/inventory/catalogs/providers/**").hasAnyRole("ADMIN", "ALMACENISTA")
                        .pathMatchers("/inventory/api/inventory/catalogs/**").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.PATCH, "/inventory/api/inventory/items/*/deactivate").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.POST, "/inventory/api/inventory/items/*/returns").hasAnyRole("ADMIN", "ALMACENISTA", "SERVICIO")
                        .pathMatchers(HttpMethod.POST, "/inventory/api/inventory/internal/items/decrease").hasAnyRole("ADMIN", "ALMACENISTA", "SERVICIO")
                        .pathMatchers(HttpMethod.GET, "/inventory/api/inventory/items", "/inventory/api/inventory/items/*", "/inventory/api/inventory/items/low-stock").hasAnyRole("ADMIN", "ALMACENISTA", "SERVICIO")
                        .pathMatchers(HttpMethod.GET, "/inventory/api/inventory/movements").hasAnyRole("ADMIN", "ALMACENISTA")
                        .pathMatchers(HttpMethod.POST, "/rooms/api/rooms").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.PATCH, "/rooms/api/rooms/*/status").hasAnyRole("ADMIN", "RECEPCION")
                        .pathMatchers(HttpMethod.POST, "/rooms/api/rooms/*/supplies/assign").hasAnyRole("ADMIN", "ALMACENISTA", "SERVICIO")
                        .pathMatchers(HttpMethod.GET, "/rooms/api/rooms/number/**").hasAnyRole("ADMIN", "ALMACENISTA", "RECEPCION", "SERVICIO")
                        .pathMatchers(HttpMethod.GET, "/rooms/api/rooms", "/rooms/api/rooms/*", "/rooms/api/rooms/*/supplies", "/rooms/api/rooms/supplies").hasAnyRole("ADMIN", "ALMACENISTA", "RECEPCION")
                        .pathMatchers("/inventory/**").hasAnyRole("ADMIN", "ALMACENISTA")
                        .pathMatchers("/rooms/**").hasRole("ADMIN")
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    JwtEncoder jwtEncoder(@Value("${security.jwt.secret}") String secret) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(secret.getBytes(StandardCharsets.UTF_8)));
    }

    @Bean
    ReactiveJwtDecoder jwtDecoder(@Value("${security.jwt.secret}") String secret) {
        SecretKeySpec key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        return NimbusReactiveJwtDecoder.withSecretKey(key).build();
    }

    private ReactiveJwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthoritiesClaimName("roles");
        authoritiesConverter.setAuthorityPrefix("ROLE_");

        ReactiveJwtAuthenticationConverter authenticationConverter = new ReactiveJwtAuthenticationConverter();
        authenticationConverter.setJwtGrantedAuthoritiesConverter(jwt ->
                Flux.fromIterable(authoritiesConverter.convert(jwt))
        );
        return authenticationConverter;
    }
}
