package com.hotel.inventory.controller;

import com.hotel.inventory.dto.ItemStockBreakdown;
import com.hotel.inventory.dto.StockByLocationView;
import com.hotel.inventory.dto.TransferRequest;
import com.hotel.inventory.model.InventoryMovement;
import com.hotel.inventory.service.StockLocationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Consultas y operaciones de stock por ubicación.
 *
 *   GET  /api/inventory/stock/items/{id}    → desglose de un insumo por ubicación
 *   GET  /api/inventory/stock/locations/{id}→ todos los insumos en una ubicación
 *   POST /api/inventory/stock/transfers      → transferir entre ubicaciones
 */
@RestController
@RequestMapping("/api/inventory/stock")
public class StockController {

    private final StockLocationService stockLocationService;

    public StockController(StockLocationService stockLocationService) {
        this.stockLocationService = stockLocationService;
    }

    @GetMapping("/items/{itemId}")
    public ItemStockBreakdown byItem(@PathVariable Long itemId) {
        return stockLocationService.breakdownByItem(itemId);
    }

    @GetMapping("/locations/{locationId}")
    public List<StockByLocationView> byLocation(@PathVariable Long locationId) {
        return stockLocationService.byLocation(locationId);
    }

    @PostMapping("/transfers")
    @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA','SERVICIO')")
    public ResponseEntity<InventoryMovement> transfer(@Valid @RequestBody TransferRequest request,
                                                      Authentication authentication) {
        InventoryMovement movement = stockLocationService.transfer(request, authentication.getName());
        return ResponseEntity.status(201).body(movement);
    }
}
