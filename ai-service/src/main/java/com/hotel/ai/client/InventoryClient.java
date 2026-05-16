package com.hotel.ai.client;

import com.hotel.ai.dto.InventoryItemDto;
import com.hotel.ai.dto.InventoryMovementDto;
import com.hotel.ai.dto.InventorySummaryDto;
import com.hotel.ai.dto.LowStockAlertDto;
import com.hotel.ai.dto.SimpleAreaDto;
import com.hotel.ai.dto.SimpleCategoryDto;
import com.hotel.ai.dto.SimpleProviderDto;
import com.hotel.ai.dto.TopUsedItemDto;

import java.time.LocalDate;

import java.util.List;

public interface InventoryClient {
    List<InventoryItemDto> listItems();

    List<InventoryItemDto> lowStockItems();

    List<InventoryMovementDto> listMovements();

    List<TopUsedItemDto> topUsedItems(LocalDate startDate, LocalDate endDate);

    List<InventorySummaryDto> inventoryReport(LocalDate startDate, LocalDate endDate);

    List<LowStockAlertDto> lowStockAlerts();

    List<SimpleProviderDto> providers();

    List<SimpleAreaDto> areas();

    List<SimpleCategoryDto> categories();
}
