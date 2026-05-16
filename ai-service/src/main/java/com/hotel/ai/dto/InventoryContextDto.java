package com.hotel.ai.dto;

import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.List;

public class InventoryContextDto {
    @Valid
    private List<InventoryItemDto> items = new ArrayList<>();

    public List<InventoryItemDto> getItems() {
        return items;
    }

    public void setItems(List<InventoryItemDto> items) {
        this.items = items == null ? new ArrayList<>() : items;
    }
}
