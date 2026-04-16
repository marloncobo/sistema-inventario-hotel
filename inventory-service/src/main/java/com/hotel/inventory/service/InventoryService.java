package com.hotel.inventory.service;

import com.hotel.inventory.dto.CreateSupplyItemRequest;
import com.hotel.inventory.dto.InternalStockDecreaseRequest;
import com.hotel.inventory.dto.StockChangeResponse;
import com.hotel.inventory.dto.StockEntryRequest;
import com.hotel.inventory.dto.StockReturnRequest;
import com.hotel.inventory.dto.UpdateSupplyItemRequest;
import com.hotel.inventory.exception.BusinessException;
import com.hotel.inventory.exception.NotFoundException;
import com.hotel.inventory.model.InventoryMovement;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.repository.InventoryMovementRepository;
import com.hotel.inventory.repository.SupplyItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class InventoryService {
    private final SupplyItemRepository supplyItemRepository;
    private final InventoryMovementRepository movementRepository;

    public InventoryService(SupplyItemRepository supplyItemRepository, InventoryMovementRepository movementRepository) {
        this.supplyItemRepository = supplyItemRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional
    public SupplyItem createItem(CreateSupplyItemRequest request) {
        validateUniqueItem(request.code(), request.name(), null);
        validateStockBounds(request.stock(), request.minStock(), request.maxStock());

        SupplyItem item = new SupplyItem(
                normalize(request.code()), request.name(), request.description(), normalize(request.category()),
                normalize(request.unit()), request.providerName(), request.stock(), request.minStock(),
                request.maxStock(), true
        );
        SupplyItem saved = supplyItemRepository.save(item);
        if (saved.getStock() > 0) {
            movementRepository.save(buildMovement(saved, "ENTRADA", "NO_APLICA", saved.getStock(), 0,
                    saved.getStock(), null, null, saved.getProviderName(), "sistema", "Carga inicial"));
        }
        return saved;
    }

    public List<SupplyItem> listItems() {
        return supplyItemRepository.findAll();
    }

    public List<SupplyItem> listItemsByCategory(String category) {
        return supplyItemRepository.findByCategoryIgnoreCase(category);
    }

    public SupplyItem getItem(Long id) {
        return supplyItemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe el insumo con id " + id));
    }

    @Transactional
    public SupplyItem updateItem(Long id, UpdateSupplyItemRequest request) {
        SupplyItem item = getItem(id);
        validateUniqueItem(request.code(), request.name(), id);
        validateStockBounds(item.getStock(), request.minStock(), request.maxStock());

        item.setCode(normalize(request.code()));
        item.setName(request.name());
        item.setDescription(request.description());
        item.setCategory(normalize(request.category()));
        item.setUnit(normalize(request.unit()));
        item.setProviderName(request.providerName());
        item.setMinStock(request.minStock());
        item.setMaxStock(request.maxStock());
        if (request.active() != null) {
            item.setActive(request.active());
        }
        return supplyItemRepository.save(item);
    }

    @Transactional
    public SupplyItem deactivateItem(Long id) {
        SupplyItem item = getItem(id);
        item.setActive(false);
        return supplyItemRepository.save(item);
    }

    @Transactional
    public SupplyItem addStock(Long itemId, StockEntryRequest request) {
        SupplyItem item = getItem(itemId);
        ensureActive(item);
        int stockBefore = item.getStock();
        int stockAfter = stockBefore + request.quantity();
        validateStockBounds(stockAfter, item.getMinStock(), item.getMaxStock());

        item.setStock(stockAfter);
        movementRepository.save(buildMovement(item, "ENTRADA", "NO_APLICA", request.quantity(), stockBefore,
                stockAfter, null, null, request.providerName(), request.responsible(), request.referenceText()));
        return supplyItemRepository.save(item);
    }

    @Transactional
    public StockChangeResponse decreaseStock(InternalStockDecreaseRequest request) {
        SupplyItem item = getItem(request.itemId());
        ensureActive(item);
        if (item.getStock() < request.quantity()) {
            throw new BusinessException("Stock insuficiente para el insumo " + item.getName());
        }

        String origin = normalize(request.origin());
        validateExitOrigin(origin, request.roomNumber(), request.areaName());
        int stockBefore = item.getStock();
        int stockAfter = stockBefore - request.quantity();

        item.setStock(stockAfter);
        movementRepository.save(buildMovement(item, "SALIDA", origin, request.quantity(), stockBefore, stockAfter,
                request.roomNumber(), request.areaName(), null, request.responsible(), request.referenceText()));
        supplyItemRepository.save(item);
        return new StockChangeResponse(item.getId(), item.getName(), item.getStock(), "Stock descontado correctamente");
    }

    @Transactional
    public StockChangeResponse returnStock(Long itemId, StockReturnRequest request) {
        SupplyItem item = getItem(itemId);
        ensureActive(item);
        int stockBefore = item.getStock();
        int stockAfter = stockBefore + request.quantity();
        validateStockBounds(stockAfter, item.getMinStock(), item.getMaxStock());

        item.setStock(stockAfter);
        movementRepository.save(buildMovement(item, "DEVOLUCION", "NO_APLICA", request.quantity(), stockBefore,
                stockAfter, request.roomNumber(), request.areaName(), null, request.responsible(), request.referenceText()));
        supplyItemRepository.save(item);
        return new StockChangeResponse(item.getId(), item.getName(), item.getStock(), "Stock devuelto correctamente");
    }

    public List<InventoryMovement> listMovements(String type, String origin, String roomNumber, String responsible) {
        return movementRepository.search(
                blankToNullLower(type),
                blankToNullLower(origin),
                blankToNullLower(roomNumber),
                blankToNullLower(responsible)
        );
    }

    public List<SupplyItem> lowStockItems() {
        return supplyItemRepository.findLowStockItems();
    }

    private InventoryMovement buildMovement(SupplyItem item, String type, String origin, Integer quantity,
                                            Integer stockBefore, Integer stockAfter, String roomNumber,
                                            String areaName, String providerName, String responsible,
                                            String referenceText) {
        return new InventoryMovement(item.getId(), item.getName(), type, origin, quantity, stockBefore, stockAfter,
                roomNumber, areaName, providerName, responsible, referenceText, "VALIDO", LocalDateTime.now());
    }

    private void validateUniqueItem(String code, String name, Long currentId) {
        if (currentId == null) {
            if (supplyItemRepository.existsByCodeIgnoreCase(code)) {
                throw new BusinessException("Ya existe un insumo con codigo " + code);
            }
            if (supplyItemRepository.existsByNameIgnoreCase(name)) {
                throw new BusinessException("Ya existe un insumo con nombre " + name);
            }
            return;
        }
        if (supplyItemRepository.existsByCodeIgnoreCaseAndIdNot(code, currentId)) {
            throw new BusinessException("Ya existe un insumo con codigo " + code);
        }
        if (supplyItemRepository.existsByNameIgnoreCaseAndIdNot(name, currentId)) {
            throw new BusinessException("Ya existe un insumo con nombre " + name);
        }
    }

    private void validateStockBounds(Integer stock, Integer minStock, Integer maxStock) {
        if (stock < 0 || minStock < 0) {
            throw new BusinessException("El stock y el stock minimo no pueden ser negativos");
        }
        if (maxStock != null && maxStock < minStock) {
            throw new BusinessException("El stock maximo debe ser mayor o igual al stock minimo");
        }
        if (maxStock != null && stock > maxStock) {
            throw new BusinessException("El stock no puede superar el stock maximo configurado");
        }
    }

    private void ensureActive(SupplyItem item) {
        if (!Boolean.TRUE.equals(item.getActive())) {
            throw new BusinessException("No se permiten movimientos con insumos inactivos");
        }
    }

    private void validateExitOrigin(String origin, String roomNumber, String areaName) {
        if (!List.of("HABITACION", "VENTA", "CONSUMO_INTERNO", "MERMA").contains(origin)) {
            throw new BusinessException("Origen de salida no valido: " + origin);
        }
        if ("HABITACION".equals(origin) && isBlank(roomNumber)) {
            throw new BusinessException("Las salidas a habitacion deben indicar una habitacion");
        }
        if ("CONSUMO_INTERNO".equals(origin) && isBlank(areaName)) {
            throw new BusinessException("Las salidas por consumo interno deben indicar un area");
        }
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String blankToNullLower(String value) {
        return isBlank(value) ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
