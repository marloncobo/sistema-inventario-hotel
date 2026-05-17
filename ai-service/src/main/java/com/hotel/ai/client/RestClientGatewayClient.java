package com.hotel.ai.client;

import com.hotel.ai.dto.AppUserDto;
import com.hotel.ai.exception.ExternalServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;

@Component
public class RestClientGatewayClient implements GatewayClient {
    private static final Logger log = LoggerFactory.getLogger(RestClientGatewayClient.class);
    private static final ParameterizedTypeReference<List<AppUserDto>> USER_LIST_TYPE = new ParameterizedTypeReference<>() {
    };

    private final RestClient gatewayRestClient;

    public RestClientGatewayClient(@Qualifier("gatewayRestClient") RestClient gatewayRestClient) {
        this.gatewayRestClient = gatewayRestClient;
    }

    @Override
    public List<AppUserDto> listUsers() {
        return optionalList("/auth/users", USER_LIST_TYPE, "usuarios");
    }

    private <T> List<T> optionalList(String uri, ParameterizedTypeReference<List<T>> type, String label, Object... uriVariables) {
        try {
            List<T> body = gatewayRestClient.get()
                    .uri(uri, uriVariables)
                    .retrieve()
                    .body(type);
            return body == null ? List.of() : body;
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().equals(HttpStatusCode.valueOf(403))
                    || ex.getStatusCode().equals(HttpStatusCode.valueOf(401))
                    || ex.getStatusCode().is5xxServerError()) {
                log.warn("Omitting optional gateway block '{}' because gateway-service responded {} {}", label, ex.getStatusCode().value(), ex.getStatusText());
                return List.of();
            }
            throw new ExternalServiceException("gateway-service rechazo la consulta de " + label + ": " + ex.getStatusCode().value() + " " + ex.getStatusText(), ex);
        } catch (ResourceAccessException ex) {
            throw new ExternalServiceException("No fue posible conectar con gateway-service para obtener " + label, ex);
        }
    }
}
