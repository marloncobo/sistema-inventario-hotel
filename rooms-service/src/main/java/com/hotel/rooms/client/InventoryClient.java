package com.hotel.rooms.client;

import com.hotel.rooms.dto.InternalStockDecreaseRequest;
import com.hotel.rooms.dto.StockChangeResponse;

public interface InventoryClient {
    StockChangeResponse decreaseStock(InternalStockDecreaseRequest request);
}
