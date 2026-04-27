package com.hotel.rooms.config;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.mock.http.client.MockClientHttpResponse;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class RestClientConfigTest {
    @AfterEach
    void clearRequestContext() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void inventoryRestClientForwardsAuthorizationHeader() {
        CapturingRequestFactory requestFactory = new CapturingRequestFactory();
        RestClient restClient = restClient(requestFactory, requestWithHeader(HttpHeaders.AUTHORIZATION, "Bearer direct-token"));

        restClient.get()
                .uri("/api/inventory/items/1")
                .retrieve()
                .toBodilessEntity();

        assertThat(requestFactory.authorizationHeader()).isEqualTo("Bearer direct-token");
    }

    @Test
    void inventoryRestClientFallsBackToForwardedAuthorizationHeader() {
        CapturingRequestFactory requestFactory = new CapturingRequestFactory();
        RestClient restClient = restClient(requestFactory, requestWithHeader("X-Forwarded-Authorization", "Bearer forwarded-token"));

        restClient.get()
                .uri("/api/inventory/items/1")
                .retrieve()
                .toBodilessEntity();

        assertThat(requestFactory.authorizationHeader()).isEqualTo("Bearer forwarded-token");
    }

    private RestClient restClient(CapturingRequestFactory requestFactory, HttpServletRequest request) {
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        RestClient.Builder builder = RestClient.builder().requestFactory(requestFactory);
        return new RestClientConfig().inventoryRestClient(builder, "http://inventory-service:8081");
    }

    private MockHttpServletRequest requestWithHeader(String headerName, String headerValue) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(headerName, headerValue);
        return request;
    }

    private static final class CapturingRequestFactory implements ClientHttpRequestFactory {
        private HttpHeaders capturedHeaders;

        @Override
        public ClientHttpRequest createRequest(URI uri, HttpMethod httpMethod) throws IOException {
            return new MockClientHttpRequest(httpMethod, uri) {
                @Override
                protected org.springframework.http.client.ClientHttpResponse executeInternal() {
                    capturedHeaders = new HttpHeaders();
                    capturedHeaders.putAll(getHeaders());
                    return new MockClientHttpResponse("{}".getBytes(StandardCharsets.UTF_8), HttpStatus.OK);
                }
            };
        }

        private String authorizationHeader() {
            return capturedHeaders == null ? null : capturedHeaders.getFirst(HttpHeaders.AUTHORIZATION);
        }
    }
}
