package com.hotel.ai.client;

import com.hotel.ai.dto.InventoryItemDto;

import java.util.List;

public interface InventoryClient {
    List<InventoryItemDto> listItems();

    List<InventoryItemDto> lowStockItems();
}
