package com.hotel.inventory.dto;

import java.math.BigDecimal;

public record InventorySummaryReport(
        Long itemId,
        String code,
        String name,
        String category,
        String unit,
        Integer currentStock,
        Integer minStock,
        Integer maxStock,
        boolean lowStock,
        BigDecimal turnoverQuantity
) {}
