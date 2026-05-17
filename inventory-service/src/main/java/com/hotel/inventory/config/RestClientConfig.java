package com.hotel.inventory.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class RestClientConfig {
    @Bean
    public RestClient roomsRestClient(RestClient.Builder builder,
                                      @Value("${services.rooms.base-url:http://localhost:8082}") String baseUrl) {
        return builder
                .baseUrl(baseUrl)
                .requestInterceptor((request, body, execution) -> {
                    ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                    if (attributes != null) {
                        String authorization = attributes.getRequest().getHeader(HttpHeaders.AUTHORIZATION);
                        if (authorization == null || authorization.isBlank()) {
                            authorization = attributes.getRequest().getHeader("X-Forwarded-Authorization");
                        }
                        if (authorization != null && !authorization.isBlank()) {
                            request.getHeaders().set(HttpHeaders.AUTHORIZATION, authorization);
                        }
                    }
                    return execution.execute(request, body);
                })
                .build();
    }
}
