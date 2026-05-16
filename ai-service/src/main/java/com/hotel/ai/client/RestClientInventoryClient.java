package com.hotel.ai.client;

import com.hotel.ai.dto.InventoryItemDto;
import com.hotel.ai.exception.ExternalServiceException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;

@Component
public class RestClientInventoryClient implements InventoryClient {
    private static final ParameterizedTypeReference<List<InventoryItemDto>> ITEM_LIST_TYPE = new ParameterizedTypeReference<>() {
    };

    private final RestClient inventoryRestClient;

    public RestClientInventoryClient(@Qualifier("inventoryRestClient") RestClient inventoryRestClient) {
        this.inventoryRestClient = inventoryRestClient;
    }

    @Override
    public List<InventoryItemDto> listItems() {
        try {
            return inventoryRestClient.get()
                    .uri("/api/inventory/items")
                    .retrieve()
                    .body(ITEM_LIST_TYPE);
        } catch (RestClientResponseException ex) {
            throw new ExternalServiceException("inventory-service rechazo la consulta de items: " + ex.getStatusCode().value() + " " + ex.getStatusText(), ex);
        } catch (ResourceAccessException ex) {
            throw new ExternalServiceException("No fue posible conectar con inventory-service para obtener los items", ex);
        }
    }

    @Override
    public List<InventoryItemDto> lowStockItems() {
        try {
            return inventoryRestClient.get()
                    .uri("/api/inventory/items/low-stock")
                    .retrieve()
                    .body(ITEM_LIST_TYPE);
        } catch (RestClientResponseException ex) {
            throw new ExternalServiceException("inventory-service rechazo la consulta de stock bajo: " + ex.getStatusCode().value() + " " + ex.getStatusText(), ex);
        } catch (ResourceAccessException ex) {
            throw new ExternalServiceException("No fue posible conectar con inventory-service para obtener el stock bajo", ex);
        }
    }
}
