package com.hotel.inventory.dto;

import com.hotel.inventory.model.StockByLocation;

import java.math.BigDecimal;

/** Vista plana del saldo de un insumo en una ubicación. */
public record StockByLocationView(
        Long itemId,
        String itemCode,
        String itemName,
        Long locationId,
        String locationCode,
        String locationName,
        String locationType,
        BigDecimal quantity,
        Integer minStock
) {
    public static StockByLocationView from(StockByLocation s) {
        return new StockByLocationView(
                s.getItemId(), s.getItemCode(), s.getItemName(),
                s.getLocationId(), s.getLocationCode(), s.getLocationName(), s.getLocationType(),
                s.getQuantity(), s.getMinStock()
        );
    }
}
