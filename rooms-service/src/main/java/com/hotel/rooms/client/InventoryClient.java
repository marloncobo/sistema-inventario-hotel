package com.hotel.rooms.client;

import com.hotel.rooms.dto.InternalStockDecreaseRequest;
import com.hotel.rooms.dto.InventoryItemResponse;
import com.hotel.rooms.dto.StockChangeResponse;

public interface InventoryClient {
    InventoryItemResponse getItem(Long itemId);
    StockChangeResponse decreaseStock(InternalStockDecreaseRequest request);
}
