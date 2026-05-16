package com.hotel.ai.client;

import com.hotel.ai.dto.InventoryItemDto;
import com.hotel.ai.dto.InventoryMovementDto;
import com.hotel.ai.dto.InventorySummaryDto;
import com.hotel.ai.dto.LowStockAlertDto;
import com.hotel.ai.dto.SimpleAreaDto;
import com.hotel.ai.dto.SimpleCategoryDto;
import com.hotel.ai.dto.SimpleProviderDto;
import com.hotel.ai.dto.TopUsedItemDto;
import com.hotel.ai.exception.ExternalServiceException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDate;
import java.util.List;

@Component
public class RestClientInventoryClient implements InventoryClient {
    private static final Logger log = LoggerFactory.getLogger(RestClientInventoryClient.class);
    private static final ParameterizedTypeReference<List<InventoryItemDto>> ITEM_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<List<InventoryMovementDto>> MOVEMENT_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<List<TopUsedItemDto>> TOP_USED_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<List<InventorySummaryDto>> INVENTORY_REPORT_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<List<LowStockAlertDto>> ALERT_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<List<SimpleProviderDto>> PROVIDER_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<List<SimpleAreaDto>> AREA_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<List<SimpleCategoryDto>> CATEGORY_LIST_TYPE = new ParameterizedTypeReference<>() {
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

    @Override
    public List<InventoryMovementDto> listMovements() {
        return optionalList("/api/inventory/movements", MOVEMENT_LIST_TYPE, "movimientos");
    }

    @Override
    public List<TopUsedItemDto> topUsedItems(LocalDate startDate, LocalDate endDate) {
        return optionalList("/api/inventory/reports/top-used?startDate={startDate}&endDate={endDate}", TOP_USED_LIST_TYPE, "top usados", startDate, endDate);
    }

    @Override
    public List<InventorySummaryDto> inventoryReport(LocalDate startDate, LocalDate endDate) {
        return optionalList("/api/inventory/reports/inventory?startDate={startDate}&endDate={endDate}", INVENTORY_REPORT_LIST_TYPE, "reporte de inventario", startDate, endDate);
    }

    @Override
    public List<LowStockAlertDto> lowStockAlerts() {
        return optionalList("/api/inventory/alerts/low-stock?openOnly=true", ALERT_LIST_TYPE, "alertas");
    }

    @Override
    public List<SimpleProviderDto> providers() {
        return optionalList("/api/inventory/catalogs/providers", PROVIDER_LIST_TYPE, "proveedores");
    }

    @Override
    public List<SimpleAreaDto> areas() {
        return optionalList("/api/inventory/catalogs/areas", AREA_LIST_TYPE, "areas");
    }

    @Override
    public List<SimpleCategoryDto> categories() {
        return optionalList("/api/inventory/catalogs/categories", CATEGORY_LIST_TYPE, "categorias");
    }

    private <T> List<T> optionalList(String uri, ParameterizedTypeReference<List<T>> type, String label, Object... uriVariables) {
        try {
            List<T> body = inventoryRestClient.get()
                    .uri(uri, uriVariables)
                    .retrieve()
                    .body(type);
            return body == null ? List.of() : body;
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().equals(HttpStatusCode.valueOf(403))
                    || ex.getStatusCode().equals(HttpStatusCode.valueOf(401))
                    || ex.getStatusCode().is5xxServerError()) {
                log.warn("Omitting optional inventory block '{}' because inventory-service responded {} {}", label, ex.getStatusCode().value(), ex.getStatusText());
                return List.of();
            }
            throw new ExternalServiceException("inventory-service rechazo la consulta de " + label + ": " + ex.getStatusCode().value() + " " + ex.getStatusText(), ex);
        } catch (ResourceAccessException ex) {
            throw new ExternalServiceException("No fue posible conectar con inventory-service para obtener " + label, ex);
        }
    }
}
