package com.hotel.inventory.dto;

import java.math.BigDecimal;
import java.util.List;

/** Desglose por ubicación del stock de un insumo + total. */
public record ItemStockBreakdown(
        Long itemId,
        String itemCode,
        String itemName,
        BigDecimal total,
        Integer totalRounded,
        List<StockByLocationView> byLocation
) {}
