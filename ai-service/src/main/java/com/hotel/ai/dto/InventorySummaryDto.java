package com.hotel.ai.dto;

import java.math.BigDecimal;

public class InventorySummaryDto {
    private Long itemId;
    private String code;
    private String name;
    private String category;
    private String unit;
    private Integer currentStock;
    private Integer minStock;
    private Integer maxStock;
    private boolean lowStock;
    private BigDecimal turnoverQuantity;

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Integer getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
    }

    public Integer getMinStock() {
        return minStock;
    }

    public void setMinStock(Integer minStock) {
        this.minStock = minStock;
    }

    public Integer getMaxStock() {
        return maxStock;
    }

    public void setMaxStock(Integer maxStock) {
        this.maxStock = maxStock;
    }

    public boolean isLowStock() {
        return lowStock;
    }

    public void setLowStock(boolean lowStock) {
        this.lowStock = lowStock;
    }

    public BigDecimal getTurnoverQuantity() {
        return turnoverQuantity;
    }

    public void setTurnoverQuantity(BigDecimal turnoverQuantity) {
        this.turnoverQuantity = turnoverQuantity;
    }
}
