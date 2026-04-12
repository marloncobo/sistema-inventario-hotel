package com.lunara.inventory.service;

import com.lunara.inventory.dto.InventoryDtos;
import com.lunara.inventory.exception.BusinessException;
import com.lunara.inventory.model.*;
import com.lunara.inventory.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InventoryService {
    private final StockRepository stockRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InternalRequestRepository internalRequestRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final InventoryMovementLineRepository inventoryMovementLineRepository;
    private final AuditEventRepository auditEventRepository;
    public InventoryService(StockRepository stockRepository, PurchaseOrderRepository purchaseOrderRepository, InternalRequestRepository internalRequestRepository, InventoryMovementRepository inventoryMovementRepository, InventoryMovementLineRepository inventoryMovementLineRepository, AuditEventRepository auditEventRepository) {
        this.stockRepository = stockRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.internalRequestRepository = internalRequestRepository;
        this.inventoryMovementRepository = inventoryMovementRepository;
        this.inventoryMovementLineRepository = inventoryMovementLineRepository;
        this.auditEventRepository = auditEventRepository;
    }
    public List<Stock> findAllStocks() { return stockRepository.findAll(); }
    public List<Stock> findByProduct(Long productId) { return stockRepository.findByProductId(productId); }
    public List<Stock> findByWarehouse(Long warehouseId) { return stockRepository.findByWarehouseId(warehouseId); }
    public List<InventoryMovement> movementHistory(LocalDate from, LocalDate to) { return (from == null || to == null) ? inventoryMovementRepository.findAll() : inventoryMovementRepository.findByCreatedAtBetween(from.atStartOfDay(), to.plusDays(1).atStartOfDay()); }
    public List<InventoryMovement> productTraceability(Long productId) { return inventoryMovementRepository.findByLinesProductIdOrderByCreatedAtDesc(productId); }
    public List<Stock> lowStock() { return stockRepository.findAll().stream().filter(s -> s.getCurrentQuantity().compareTo(s.getMinimumStock()) < 0).collect(Collectors.toList()); }
    public List<InventoryMovementLine> expirationAlerts(int days) { return inventoryMovementLineRepository.findByExpirationDateBetween(LocalDate.now(), LocalDate.now().plusDays(days)); }
    public List<PurchaseOrder> purchaseOrders() { return purchaseOrderRepository.findAll(); }
    public List<InternalRequest> internalRequests() { return internalRequestRepository.findAll(); }
    public List<AuditEvent> audit() { return auditEventRepository.findAll(); }
    public Map<String, Object> dashboard() {
        Map<String, Object> data = new LinkedHashMap<String, Object>();
        data.put("criticalStockProducts", lowStock().size());
        data.put("pendingRequests", internalRequestRepository.findAll().stream().filter(r -> r.getStatus() == InternalRequestStatus.PENDING).count());
        data.put("draftPurchaseOrders", purchaseOrderRepository.findAll().stream().filter(o -> o.getStatus() == PurchaseOrderStatus.DRAFT).count());
        data.put("recentEntries", inventoryMovementRepository.findAll().stream().filter(m -> m.getType() == MovementType.ENTRY || m.getType() == MovementType.ADJUSTMENT_ENTRY).count());
        data.put("recentExits", inventoryMovementRepository.findAll().stream().filter(m -> m.getType() == MovementType.EXIT || m.getType() == MovementType.ADJUSTMENT_EXIT).count());
        return data;
    }
    public List<Map<String, Object>> consumptionByProduct(Long productId) {
        return internalRequestRepository.findAll().stream().flatMap(request -> request.getLines().stream().filter(line -> line.getProductId().equals(productId) && line.getDispatchedQuantity().compareTo(BigDecimal.ZERO) > 0).map(line -> {
            Map<String, Object> row = new LinkedHashMap<String, Object>();
            row.put("areaId", request.getAreaId()); row.put("areaName", request.getAreaName()); row.put("requestNumber", request.getRequestNumber()); row.put("quantity", line.getDispatchedQuantity()); return row;
        })).collect(Collectors.toList());
    }
    public String exportStocksCsv() {
        StringBuilder builder = new StringBuilder("productId,productCode,productName,warehouseId,warehouseName,currentQuantity,minimumStock,maximumStock\n");
        for (Stock stock : stockRepository.findAll()) builder.append(stock.getProductId()).append(",").append(stock.getProductCode()).append(",").append(stock.getProductName()).append(",").append(stock.getWarehouseId()).append(",").append(stock.getWarehouseName()).append(",").append(stock.getCurrentQuantity()).append(",").append(stock.getMinimumStock()).append(",").append(stock.getMaximumStock()).append("\n");
        return builder.toString();
    }
    public String exportMovementsCsv(LocalDate from, LocalDate to) {
        StringBuilder builder = new StringBuilder("movementId,type,origin,warehouse,responsible,reference,createdAt\n");
        for (InventoryMovement movement : movementHistory(from, to)) builder.append(movement.getId()).append(",").append(movement.getType()).append(",").append(movement.getOrigin()).append(",").append(movement.getWarehouseName()).append(",").append(movement.getResponsibleUser()).append(",").append(movement.getReferenceNumber()).append(",").append(movement.getCreatedAt()).append("\n");
        return builder.toString();
    }

    @Transactional
    public Stock registerInitialStock(InventoryDtos.StockLoadRequest request) {
        validateRange(request.getMinimumStock(), request.getMaximumStock());
        Stock stock = stockRepository.findByProductIdAndWarehouseId(request.getProductId(), request.getWarehouseId()).orElse(new Stock());
        stock.setProductId(request.getProductId()); stock.setProductCode(request.getProductCode()); stock.setProductName(request.getProductName()); stock.setWarehouseId(request.getWarehouseId()); stock.setWarehouseName(request.getWarehouseName()); stock.setCurrentQuantity(safe(stock.getCurrentQuantity()).add(request.getQuantity())); stock.setMinimumStock(request.getMinimumStock()); stock.setMaximumStock(request.getMaximumStock()); stock.setUpdatedAt(LocalDateTime.now());
        Stock saved = stockRepository.save(stock);
        createMovement(MovementType.ENTRY, MovementOrigin.INITIAL, request, "INITIAL-STOCK", request.getObservations()); audit("STOCK_INITIAL", "Carga inicial para producto " + request.getProductCode()); return saved;
    }

    @Transactional
    public Stock manualEntry(InventoryDtos.MovementRequest request) {
        Stock saved = increaseStock(request, null, null); createMovement(MovementType.ADJUSTMENT_ENTRY, MovementOrigin.MANUAL_ENTRY, request, "MANUAL-ENTRY", request.getObservations()); audit("MANUAL_ENTRY", "Entrada manual para producto " + request.getProductCode()); return saved;
    }

    @Transactional
    public Stock manualExit(InventoryDtos.MovementRequest request) {
        Stock saved = decreaseStock(request.getProductId(), request.getWarehouseId(), request.getQuantity()); createMovement(MovementType.ADJUSTMENT_EXIT, MovementOrigin.MANUAL_EXIT, request, "MANUAL-EXIT", request.getObservations()); audit("MANUAL_EXIT", "Salida manual para producto " + request.getProductCode()); return saved;
    }

    @Transactional
    public PurchaseOrder createPurchaseOrder(InventoryDtos.PurchaseOrderRequest request) {
        PurchaseOrder order = new PurchaseOrder(); order.setOrderNumber("OC-" + System.currentTimeMillis()); order.setSupplierId(request.getSupplierId()); order.setSupplierName(request.getSupplierName()); order.setCreatedBy(currentUser()); order.setExpectedDate(request.getExpectedDate()); order.setObservations(request.getObservations()); order.setStatus(PurchaseOrderStatus.DRAFT); order.setCreatedAt(LocalDateTime.now());
        for (InventoryDtos.PurchaseOrderLineRequest lineRequest : request.getLines()) { PurchaseOrderLine line = new PurchaseOrderLine(); line.setPurchaseOrder(order); line.setProductId(lineRequest.getProductId()); line.setProductCode(lineRequest.getProductCode()); line.setProductName(lineRequest.getProductName()); line.setOrderedQuantity(lineRequest.getQuantity()); line.setReceivedQuantity(BigDecimal.ZERO); line.setUnitPrice(lineRequest.getUnitPrice()); order.getLines().add(line); }
        PurchaseOrder saved = purchaseOrderRepository.save(order); audit("PURCHASE_ORDER_CREATED", "Orden " + saved.getOrderNumber() + " creada"); return saved;
    }

    @Transactional
    public PurchaseOrder approvePurchaseOrder(Long id) { PurchaseOrder order = getPurchaseOrder(id); order.setStatus(PurchaseOrderStatus.APPROVED); audit("PURCHASE_ORDER_APPROVED", "Orden " + order.getOrderNumber() + " aprobada"); return purchaseOrderRepository.save(order); }

    @Transactional
    public PurchaseOrder receivePurchaseOrder(Long id, InventoryDtos.ReceiptRequest request) {
        PurchaseOrder order = getPurchaseOrder(id); if (order.getStatus() != PurchaseOrderStatus.APPROVED && order.getStatus() != PurchaseOrderStatus.PARTIALLY_RECEIVED) throw new BusinessException("La orden debe estar aprobada para recibir mercancía");
        Map<Long, PurchaseOrderLine> lineMap = order.getLines().stream().collect(Collectors.toMap(PurchaseOrderLine::getId, line -> line));
        for (InventoryDtos.ReceiptLineRequest receiptLine : request.getLines()) {
            PurchaseOrderLine line = lineMap.get(receiptLine.getPurchaseOrderLineId()); if (line == null) throw new BusinessException("Detalle de orden no encontrado");
            BigDecimal remaining = line.getOrderedQuantity().subtract(line.getReceivedQuantity()); if (receiptLine.getQuantity().compareTo(remaining) > 0) throw new BusinessException("No se puede recibir más cantidad que la ordenada");
            line.setReceivedQuantity(line.getReceivedQuantity().add(receiptLine.getQuantity()));
            InventoryDtos.MovementRequest movementRequest = new InventoryDtos.MovementRequest();
            movementRequest.setProductId(line.getProductId()); movementRequest.setProductCode(line.getProductCode()); movementRequest.setProductName(line.getProductName()); movementRequest.setWarehouseId(request.getWarehouseId()); movementRequest.setWarehouseName(request.getWarehouseName()); movementRequest.setQuantity(receiptLine.getQuantity()); movementRequest.setUnitCost(line.getUnitPrice()); movementRequest.setLot(receiptLine.getLot()); movementRequest.setExpirationDate(receiptLine.getExpirationDate()); movementRequest.setObservations(request.getObservations() == null ? "Recepción de orden" : request.getObservations());
            increaseStock(movementRequest, BigDecimal.ZERO, null); createMovement(MovementType.ENTRY, MovementOrigin.PURCHASE_ORDER, movementRequest, order.getOrderNumber(), movementRequest.getObservations());
        }
        order.setStatus(order.getLines().stream().allMatch(line -> line.getReceivedQuantity().compareTo(line.getOrderedQuantity()) >= 0) ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED); audit("PURCHASE_ORDER_RECEIVED", "Recepción registrada para " + order.getOrderNumber()); return purchaseOrderRepository.save(order);
    }

    @Transactional
    public InternalRequest createInternalRequest(InventoryDtos.InternalRequestCreate request) {
        InternalRequest internalRequest = new InternalRequest(); internalRequest.setRequestNumber("SI-" + System.currentTimeMillis()); internalRequest.setAreaId(request.getAreaId()); internalRequest.setAreaName(request.getAreaName()); internalRequest.setRequestedBy(currentUser()); internalRequest.setStatus(InternalRequestStatus.PENDING); internalRequest.setObservations(request.getObservations()); internalRequest.setCreatedAt(LocalDateTime.now());
        for (InventoryDtos.RequestLineCreate lineRequest : request.getLines()) { InternalRequestLine line = new InternalRequestLine(); line.setInternalRequest(internalRequest); line.setProductId(lineRequest.getProductId()); line.setProductCode(lineRequest.getProductCode()); line.setProductName(lineRequest.getProductName()); line.setRequestedQuantity(lineRequest.getRequestedQuantity()); line.setApprovedQuantity(BigDecimal.ZERO); line.setDispatchedQuantity(BigDecimal.ZERO); internalRequest.getLines().add(line); }
        InternalRequest saved = internalRequestRepository.save(internalRequest); audit("REQUEST_CREATED", "Solicitud " + saved.getRequestNumber() + " creada"); return saved;
    }

    @Transactional
    public InternalRequest approveInternalRequest(Long id, InventoryDtos.InternalRequestApproval request) {
        InternalRequest internalRequest = getInternalRequest(id); internalRequest.setObservations(request.getObservations());
        if (!request.getApproved()) { internalRequest.setStatus(InternalRequestStatus.REJECTED); audit("REQUEST_REJECTED", "Solicitud " + internalRequest.getRequestNumber() + " rechazada"); return internalRequestRepository.save(internalRequest); }
        Map<Long, InternalRequestLine> lines = internalRequest.getLines().stream().collect(Collectors.toMap(InternalRequestLine::getId, line -> line));
        for (InventoryDtos.ApprovalLine approvalLine : request.getLines()) { InternalRequestLine line = lines.get(approvalLine.getRequestLineId()); if (line == null) throw new BusinessException("Detalle de solicitud no encontrado"); if (approvalLine.getApprovedQuantity().compareTo(line.getRequestedQuantity()) > 0) throw new BusinessException("No se puede aprobar más que lo solicitado"); line.setApprovedQuantity(approvalLine.getApprovedQuantity()); }
        internalRequest.setStatus(InternalRequestStatus.APPROVED); audit("REQUEST_APPROVED", "Solicitud " + internalRequest.getRequestNumber() + " aprobada"); return internalRequestRepository.save(internalRequest);
    }

    @Transactional
    public InternalRequest dispatchInternalRequest(Long id, InventoryDtos.DispatchRequest request) {
        InternalRequest internalRequest = getInternalRequest(id); if (internalRequest.getStatus() != InternalRequestStatus.APPROVED) throw new BusinessException("La solicitud debe estar aprobada para despacho");
        Map<Long, InternalRequestLine> lines = internalRequest.getLines().stream().collect(Collectors.toMap(InternalRequestLine::getId, line -> line));
        for (InventoryDtos.DispatchLine dispatchLine : request.getLines()) {
            InternalRequestLine line = lines.get(dispatchLine.getRequestLineId()); if (line == null) throw new BusinessException("Detalle de solicitud no encontrado");
            BigDecimal remaining = line.getApprovedQuantity().subtract(line.getDispatchedQuantity()); if (dispatchLine.getDispatchedQuantity().compareTo(remaining) > 0) throw new BusinessException("No se puede despachar más que lo aprobado");
            decreaseStock(line.getProductId(), request.getWarehouseId(), dispatchLine.getDispatchedQuantity()); line.setDispatchedQuantity(line.getDispatchedQuantity().add(dispatchLine.getDispatchedQuantity()));
            InventoryDtos.MovementRequest movementRequest = new InventoryDtos.MovementRequest();
            movementRequest.setProductId(line.getProductId()); movementRequest.setProductCode(line.getProductCode()); movementRequest.setProductName(line.getProductName()); movementRequest.setWarehouseId(request.getWarehouseId()); movementRequest.setWarehouseName(request.getWarehouseName()); movementRequest.setQuantity(dispatchLine.getDispatchedQuantity()); movementRequest.setUnitCost(BigDecimal.ZERO); movementRequest.setObservations(request.getObservations() == null ? "Despacho interno" : request.getObservations());
            createMovement(MovementType.EXIT, MovementOrigin.INTERNAL_REQUEST, movementRequest, internalRequest.getRequestNumber(), movementRequest.getObservations());
        }
        internalRequest.setStatus(InternalRequestStatus.DISPATCHED); audit("REQUEST_DISPATCHED", "Solicitud " + internalRequest.getRequestNumber() + " despachada"); return internalRequestRepository.save(internalRequest);
    }

    private PurchaseOrder getPurchaseOrder(Long id) { return purchaseOrderRepository.findById(id).orElseThrow(() -> new BusinessException("Orden no encontrada")); }
    private InternalRequest getInternalRequest(Long id) { return internalRequestRepository.findById(id).orElseThrow(() -> new BusinessException("Solicitud no encontrada")); }
    private Stock increaseStock(InventoryDtos.MovementRequest request, BigDecimal minimumStock, BigDecimal maximumStock) {
        Stock stock = stockRepository.findByProductIdAndWarehouseId(request.getProductId(), request.getWarehouseId()).orElse(new Stock());
        stock.setProductId(request.getProductId()); stock.setProductCode(request.getProductCode()); stock.setProductName(request.getProductName()); stock.setWarehouseId(request.getWarehouseId()); stock.setWarehouseName(request.getWarehouseName()); stock.setCurrentQuantity(safe(stock.getCurrentQuantity()).add(request.getQuantity())); stock.setMinimumStock(minimumStock == null ? safe(stock.getMinimumStock()) : minimumStock); stock.setMaximumStock(maximumStock == null ? stock.getMaximumStock() : maximumStock); stock.setUpdatedAt(LocalDateTime.now()); return stockRepository.save(stock);
    }
    private Stock decreaseStock(Long productId, Long warehouseId, BigDecimal quantity) {
        Stock stock = stockRepository.findByProductIdAndWarehouseId(productId, warehouseId).orElseThrow(() -> new BusinessException("No existe stock para el producto en la bodega"));
        BigDecimal result = safe(stock.getCurrentQuantity()).subtract(quantity); if (result.compareTo(BigDecimal.ZERO) < 0) throw new BusinessException("Stock insuficiente"); stock.setCurrentQuantity(result); stock.setUpdatedAt(LocalDateTime.now()); return stockRepository.save(stock);
    }
    private void createMovement(MovementType type, MovementOrigin origin, InventoryDtos.MovementRequest request, String reference, String observations) {
        InventoryMovement movement = new InventoryMovement(); movement.setType(type); movement.setOrigin(origin); movement.setWarehouseId(request.getWarehouseId()); movement.setWarehouseName(request.getWarehouseName()); movement.setResponsibleUser(currentUser()); movement.setReferenceNumber(reference); movement.setObservations(observations); movement.setCreatedAt(LocalDateTime.now());
        InventoryMovementLine line = new InventoryMovementLine(); line.setInventoryMovement(movement); line.setProductId(request.getProductId()); line.setProductCode(request.getProductCode()); line.setProductName(request.getProductName()); line.setQuantity(request.getQuantity()); line.setUnitCost(request.getUnitCost()); line.setLot(request.getLot()); line.setExpirationDate(request.getExpirationDate()); movement.getLines().add(line); inventoryMovementRepository.save(movement);
    }
    private void audit(String action, String description) {
        AuditEvent event = new AuditEvent(); event.setAction(action); event.setUsername(currentUser()); event.setDescription(description); event.setCreatedAt(LocalDateTime.now()); auditEventRepository.save(event);
    }
    private void validateRange(BigDecimal minimum, BigDecimal maximum) { if (maximum != null && maximum.compareTo(minimum) < 0) throw new BusinessException("El stock máximo debe ser mayor o igual al mínimo"); }
    private BigDecimal safe(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }
    private String currentUser() { return String.valueOf(SecurityContextHolder.getContext().getAuthentication().getPrincipal()); }
}
