package com.hotel.inventory.controller;

import com.hotel.inventory.dto.CreateSupplyItemRequest;
import com.hotel.inventory.dto.InternalStockDecreaseRequest;
import com.hotel.inventory.dto.StockChangeResponse;
import com.hotel.inventory.dto.StockEntryRequest;
import com.hotel.inventory.model.InventoryMovement;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/items")
    public SupplyItem createItem(@Valid @RequestBody CreateSupplyItemRequest request) {
        return inventoryService.createItem(request);
    }

    @GetMapping("/items")
    public List<SupplyItem> listItems() {
        return inventoryService.listItems();
    }

    @GetMapping("/items/{id}")
    public SupplyItem getItem(@PathVariable Long id) {
        return inventoryService.getItem(id);
    }

    @PostMapping("/items/{id}/entries")
    public SupplyItem addEntry(@PathVariable Long id, @Valid @RequestBody StockEntryRequest request) {
        return inventoryService.addStock(id, request);
    }

    @PostMapping("/internal/items/decrease")
    public StockChangeResponse decreaseStock(@Valid @RequestBody InternalStockDecreaseRequest request) {
        return inventoryService.decreaseStock(request);
    }

    @GetMapping("/movements")
    public List<InventoryMovement> listMovements() {
        return inventoryService.listMovements();
    }

    @GetMapping("/items/low-stock")
    public List<SupplyItem> lowStockItems() {
        return inventoryService.lowStockItems();
    }
}