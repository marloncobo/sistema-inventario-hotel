package com.lunara.inventory.controller;

import com.lunara.inventory.dto.InventoryDtos;
import com.lunara.inventory.model.*;
import com.lunara.inventory.service.InventoryService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class InventoryController {
    private final InventoryService inventoryService;
    public InventoryController(InventoryService inventoryService) { this.inventoryService = inventoryService; }

    @GetMapping("/stocks") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<Stock> stocks() { return inventoryService.findAllStocks(); }
    @GetMapping("/stocks/product/{productId}") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<Stock> stocksByProduct(@PathVariable Long productId) { return inventoryService.findByProduct(productId); }
    @GetMapping("/stocks/warehouse/{warehouseId}") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<Stock> stocksByWarehouse(@PathVariable Long warehouseId) { return inventoryService.findByWarehouse(warehouseId); }
    @PostMapping("/stocks/initial") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public Stock initialStock(@Valid @RequestBody InventoryDtos.StockLoadRequest request) { return inventoryService.registerInitialStock(request); }

    @PostMapping("/movements/manual-entry") @PreAuthorize("hasAuthority('ROLE_WAREHOUSE')") public Stock manualEntry(@Valid @RequestBody InventoryDtos.MovementRequest request) { return inventoryService.manualEntry(request); }
    @PostMapping("/movements/manual-exit") @PreAuthorize("hasAuthority('ROLE_WAREHOUSE')") public Stock manualExit(@Valid @RequestBody InventoryDtos.MovementRequest request) { return inventoryService.manualExit(request); }
    @GetMapping("/movements/history") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<InventoryMovement> history(@RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to) { return inventoryService.movementHistory(from, to); }
    @GetMapping("/movements/product/{productId}") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<InventoryMovement> traceability(@PathVariable Long productId) { return inventoryService.productTraceability(productId); }

    @PostMapping("/purchase-orders") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public PurchaseOrder createOrder(@Valid @RequestBody InventoryDtos.PurchaseOrderRequest request) { return inventoryService.createPurchaseOrder(request); }
    @GetMapping("/purchase-orders") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<PurchaseOrder> purchaseOrders() { return inventoryService.purchaseOrders(); }
    @PatchMapping("/purchase-orders/{id}/approve") @PreAuthorize("hasAuthority('ROLE_ADMIN')") public PurchaseOrder approveOrder(@PathVariable Long id) { return inventoryService.approvePurchaseOrder(id); }
    @PostMapping("/purchase-orders/{id}/receive") @PreAuthorize("hasAuthority('ROLE_WAREHOUSE')") public PurchaseOrder receiveOrder(@PathVariable Long id, @Valid @RequestBody InventoryDtos.ReceiptRequest request) { return inventoryService.receivePurchaseOrder(id, request); }

    @PostMapping("/internal-requests") @PreAuthorize("hasAuthority('ROLE_REQUESTER')") public InternalRequest createRequest(@Valid @RequestBody InventoryDtos.InternalRequestCreate request) { return inventoryService.createInternalRequest(request); }
    @GetMapping("/internal-requests") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE','ROLE_REQUESTER')") public List<InternalRequest> internalRequests() { return inventoryService.internalRequests(); }
    @PatchMapping("/internal-requests/{id}/approve") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public InternalRequest approveRequest(@PathVariable Long id, @Valid @RequestBody InventoryDtos.InternalRequestApproval request) { return inventoryService.approveInternalRequest(id, request); }
    @PostMapping("/internal-requests/{id}/dispatch") @PreAuthorize("hasAuthority('ROLE_WAREHOUSE')") public InternalRequest dispatchRequest(@PathVariable Long id, @Valid @RequestBody InventoryDtos.DispatchRequest request) { return inventoryService.dispatchInternalRequest(id, request); }
    @GetMapping("/internal-requests/consumption/product/{productId}") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<Map<String, Object>> consumption(@PathVariable Long productId) { return inventoryService.consumptionByProduct(productId); }

    @GetMapping("/alerts/low-stock") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<Stock> lowStock() { return inventoryService.lowStock(); }
    @GetMapping("/alerts/expirations") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<InventoryMovementLine> expirations(@RequestParam(defaultValue = "30") int days) { return inventoryService.expirationAlerts(days); }
    @GetMapping("/dashboard") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public Map<String, Object> dashboard() { return inventoryService.dashboard(); }
    @GetMapping("/audit") @PreAuthorize("hasAuthority('ROLE_ADMIN')") public List<AuditEvent> audit() { return inventoryService.audit(); }

    @GetMapping("/reports/current-inventory") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<Stock> inventoryReport() { return inventoryService.findAllStocks(); }
    @GetMapping("/reports/movements") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<InventoryMovement> movementReport(@RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to) { return inventoryService.movementHistory(from, to); }
    @GetMapping("/reports/low-stock") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<Stock> lowStockReport() { return inventoryService.lowStock(); }
    @GetMapping("/reports/current-inventory/export") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public ResponseEntity<byte[]> exportInventory() { return csv("inventario_actual.csv", inventoryService.exportStocksCsv()); }
    @GetMapping("/reports/movements/export") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public ResponseEntity<byte[]> exportMovements(@RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to) { return csv("movimientos.csv", inventoryService.exportMovementsCsv(from, to)); }

    private ResponseEntity<byte[]> csv(String filename, String content) {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"").contentType(new MediaType("text", "csv")).body(content.getBytes(StandardCharsets.UTF_8));
    }
}
