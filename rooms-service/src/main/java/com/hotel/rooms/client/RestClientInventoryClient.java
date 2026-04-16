package com.hotel.rooms.client;

import com.hotel.rooms.dto.InternalStockDecreaseRequest;
import com.hotel.rooms.dto.StockChangeResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class RestClientInventoryClient implements InventoryClient {
    private final RestClient inventoryRestClient;

    public RestClientInventoryClient(RestClient inventoryRestClient) {
        this.inventoryRestClient = inventoryRestClient;
    }

    @Override
    public StockChangeResponse decreaseStock(InternalStockDecreaseRequest request) {
        return inventoryRestClient.post()
                .uri("/api/inventory/internal/items/decrease")
                .body(request)
                .retrieve()
                .body(StockChangeResponse.class);
    }
}
