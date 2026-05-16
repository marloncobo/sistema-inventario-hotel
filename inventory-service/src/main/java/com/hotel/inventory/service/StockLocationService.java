package com.hotel.inventory.service;

import com.hotel.inventory.dto.ItemStockBreakdown;
import com.hotel.inventory.dto.StockByLocationView;
import com.hotel.inventory.dto.TransferRequest;
import com.hotel.inventory.exception.BusinessException;
import com.hotel.inventory.exception.NotFoundException;
import com.hotel.inventory.model.InventoryDocument;
import com.hotel.inventory.model.InventoryDocumentLine;
import com.hotel.inventory.model.InventoryMovement;
import com.hotel.inventory.model.Location;
import com.hotel.inventory.model.StockByLocation;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.repository.InventoryMovementRepository;
import com.hotel.inventory.repository.LocationRepository;
import com.hotel.inventory.repository.StockByLocationRepository;
import com.hotel.inventory.repository.SupplyItemRepository;
import com.hotel.inventory.util.QuantitySupport;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Fuente de verdad para saldos por ubicación. Todas las mutaciones de stock
 * deben pasar por este servicio.
 */
@Service
public class StockLocationService {

    private final StockByLocationRepository stockRepo;
    private final SupplyItemRepository itemRepo;
    private final LocationRepository locationRepo;
    private final InventoryMovementRepository movementRepo;
    private final AuditService auditService;
    private final LowStockAlertService lowStockAlertService;

    public StockLocationService(StockByLocationRepository stockRepo,
                                SupplyItemRepository itemRepo,
                                LocationRepository locationRepo,
                                InventoryMovementRepository movementRepo,
                                AuditService auditService,
                                LowStockAlertService lowStockAlertService) {
        this.stockRepo = stockRepo;
        this.itemRepo = itemRepo;
        this.locationRepo = locationRepo;
        this.movementRepo = movementRepo;
        this.auditService = auditService;
        this.lowStockAlertService = lowStockAlertService;
    }

    public ItemStockBreakdown breakdownByItem(Long itemId) {
        SupplyItem item = itemRepo.findById(itemId)
                .orElseThrow(() -> new NotFoundException("No existe el insumo " + itemId));
        List<StockByLocationView> rows = stockRepo.findByItem_Id(itemId).stream()
                .map(StockByLocationView::from)
                .toList();
        BigDecimal total = rows.stream()
                .map(StockByLocationView::quantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ItemStockBreakdown(
                item.getId(), item.getCode(), item.getName(),
                total, QuantitySupport.toCachedTotal(total), rows
        );
    }

    public List<StockByLocationView> byLocation(Long locationId) {
        if (!locationRepo.existsById(locationId)) {
            throw new NotFoundException("No existe la ubicación " + locationId);
        }
        return stockRepo.findByLocation_Id(locationId).stream()
                .map(StockByLocationView::from)
                .toList();
    }

    public BigDecimal quantityAt(Long itemId, Long locationId) {
        return stockRepo.findByItem_IdAndLocation_Id(itemId, locationId)
                .map(StockByLocation::getQuantity)
                .orElse(BigDecimal.ZERO);
    }

    @Transactional
    public StockByLocation incrementAt(Long itemId, Long locationId, BigDecimal quantity) {
        BigDecimal qty = QuantitySupport.normalize(quantity);
        SupplyItem item = itemRepo.findById(itemId)
                .orElseThrow(() -> new NotFoundException("No existe el insumo " + itemId));
        QuantitySupport.validatePositive(item, qty);
        Location location = requireActiveLocation(locationId);
        StockByLocation row = stockRepo.findByItemAndLocationForUpdate(itemId, locationId)
                .orElseGet(() -> new StockByLocation(item, location, BigDecimal.ZERO));
        row.setQuantity(row.getQuantity().add(qty));
        StockByLocation saved = stockRepo.save(row);
        syncItemTotal(item);
        return saved;
    }

    @Transactional
    public StockByLocation decrementAt(Long itemId, Long locationId, BigDecimal quantity) {
        BigDecimal qty = QuantitySupport.normalize(quantity);
        SupplyItem item = itemRepo.findById(itemId)
                .orElseThrow(() -> new NotFoundException("No existe el insumo " + itemId));
        QuantitySupport.validatePositive(item, qty);
        Location location = locationRepo.findById(locationId)
                .orElseThrow(() -> new NotFoundException("No existe la ubicación " + locationId));
        StockByLocation row = stockRepo.findByItemAndLocationForUpdate(itemId, locationId)
                .orElseThrow(() -> new BusinessException("No hay stock del insumo " + item.getCode()
                        + " en la ubicación " + location.getCode()));
        if (row.getQuantity().compareTo(qty) < 0) {
            throw new BusinessException("Stock insuficiente en " + location.getCode()
                    + ": disponible " + row.getQuantity() + ", solicitado " + qty);
        }
        row.setQuantity(row.getQuantity().subtract(qty));
        StockByLocation saved = stockRepo.save(row);
        syncItemTotal(item);
        return saved;
    }

    @Transactional
    public InventoryMovement transfer(TransferRequest req, String username) {
        return transfer(req.itemId(), req.fromLocationId(), req.toLocationId(), req.quantity(),
                null, username, req.operationalResponsible(), req.referenceText());
    }

    @Transactional
    public InventoryMovement transferForDocument(InventoryDocument document,
                                                 InventoryDocumentLine line,
                                                 String username) {
        if (document.getFromLocationEntity() == null || document.getToLocationEntity() == null) {
            throw new BusinessException("El documento de transferencia requiere origen y destino");
        }
        BigDecimal qty = line.getQuantityActual() != null
                ? QuantitySupport.toQuantity(line.getQuantityActual())
                : QuantitySupport.toQuantity(line.getQuantityExpected());
        return transfer(
                line.getItemId(),
                document.getFromLocationId(),
                document.getToLocationId(),
                qty,
                document,
                username,
                document.getResponsible(),
                "Transferencia documento " + document.getCode()
        );
    }

    @Transactional
    public InventoryMovement transfer(Long itemId, Long fromLocationId, Long toLocationId,
                                      BigDecimal quantity, InventoryDocument document,
                                      String username, String operationalResponsible,
                                      String referenceText) {
        if (fromLocationId.equals(toLocationId)) {
            throw new BusinessException("La ubicación origen y destino deben ser distintas");
        }
        BigDecimal qty = QuantitySupport.normalize(quantity);
        SupplyItem item = itemRepo.findById(itemId)
                .orElseThrow(() -> new NotFoundException("No existe el insumo " + itemId));
        QuantitySupport.validatePositive(item, qty);
        if (!Boolean.TRUE.equals(item.getActive())) {
            throw new BusinessException("El insumo " + item.getName() + " está inactivo");
        }
        Location from = requireActiveLocation(fromLocationId);
        Location to = requireActiveLocation(toLocationId);

        StockByLocation fromRow = stockRepo.findByItemAndLocationForUpdate(itemId, fromLocationId)
                .orElseThrow(() -> new BusinessException("No hay stock del insumo en la ubicación origen"));
        if (fromRow.getQuantity().compareTo(qty) < 0) {
            throw new BusinessException("Stock insuficiente en " + from.getCode()
                    + ": disponible " + fromRow.getQuantity() + ", solicitado " + qty);
        }
        StockByLocation toRow = stockRepo.findByItemAndLocationForUpdate(itemId, toLocationId)
                .orElseGet(() -> new StockByLocation(item, to, BigDecimal.ZERO));

        int globalBefore = QuantitySupport.toCachedTotal(stockRepo.sumQuantityByItem(itemId));
        fromRow.setQuantity(fromRow.getQuantity().subtract(qty));
        toRow.setQuantity(toRow.getQuantity().add(qty));
        stockRepo.save(fromRow);
        stockRepo.save(toRow);
        syncItemTotal(item);

        InventoryMovement movement = new InventoryMovement();
        movement.setItem(item);
        movement.setMovementType(InventoryMovement.Type.TRANSFERENCIA);
        movement.setOrigin("TRANSFERENCIA");
        movement.setQuantity(QuantitySupport.toCachedTotal(qty));
        movement.setStockBefore(globalBefore);
        movement.setStockAfter(item.getStock());
        movement.setFromLocation(from);
        movement.setToLocation(to);
        movement.setDocument(document);
        movement.setResponsible(username);
        movement.setOperationalResponsible(
                operationalResponsible != null && !operationalResponsible.isBlank()
                        ? operationalResponsible.trim()
                        : username
        );
        movement.setReferenceText(referenceText != null && !referenceText.isBlank()
                ? referenceText
                : "Transferencia " + from.getCode() + " → " + to.getCode());
        movement.setStatus("VALIDO");
        movement.setCreatedAt(LocalDateTime.now());
        movement.setLegacy(false);

        InventoryMovement saved = movementRepo.save(movement);
        auditService.record("TRANSFER", "InventoryMovement", saved.getId(), username,
                "item=" + item.getCode() + " " + from.getCode() + "→" + to.getCode() + " qty=" + qty);
        return saved;
    }

    public void syncItemTotal(SupplyItem item) {
        BigDecimal total = stockRepo.sumQuantityByItem(item.getId());
        item.setStock(QuantitySupport.toCachedTotal(total));
        itemRepo.save(item);
        lowStockAlertService.evaluate(item);
    }

    private Location requireActiveLocation(Long locationId) {
        Location location = locationRepo.findById(locationId)
                .orElseThrow(() -> new NotFoundException("No existe la ubicación " + locationId));
        if (!Boolean.TRUE.equals(location.getActive())) {
            throw new BusinessException("La ubicación " + location.getCode() + " está inactiva");
        }
        return location;
    }
}
