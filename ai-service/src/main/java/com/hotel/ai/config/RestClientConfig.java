package com.hotel.ai.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class RestClientConfig {

    @Bean
    @Qualifier("inventoryRestClient")
    public RestClient inventoryRestClient(RestClient.Builder builder, ServicesProperties servicesProperties) {
        return builder
                .baseUrl(servicesProperties.getInventory().getBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
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

    @Bean
    @Qualifier("geminiRestClient")
    public RestClient geminiRestClient(RestClient.Builder builder, GeminiProperties geminiProperties) {
        return builder
                .baseUrl(geminiProperties.getBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .requestInterceptor((request, body, execution) -> {
                    if (geminiProperties.getApiKey() != null && !geminiProperties.getApiKey().isBlank()) {
                        request.getHeaders().set("x-goog-api-key", geminiProperties.getApiKey());
                    }
                    return execution.execute(request, body);
                })
                .build();
    }
}
