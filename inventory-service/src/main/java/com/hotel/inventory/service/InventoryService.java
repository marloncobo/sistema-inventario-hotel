package com.hotel.inventory.service;

import com.hotel.inventory.dto.CreateSupplyItemRequest;
import com.hotel.inventory.dto.InternalStockDecreaseRequest;
import com.hotel.inventory.dto.StockChangeResponse;
import com.hotel.inventory.dto.StockEntryRequest;
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

@Service
public class InventoryService {
    private final SupplyItemRepository supplyItemRepository;
    private final InventoryMovementRepository movementRepository;

    public InventoryService(SupplyItemRepository supplyItemRepository, InventoryMovementRepository movementRepository) {
        this.supplyItemRepository = supplyItemRepository;
        this.movementRepository = movementRepository;
    }

    public SupplyItem createItem(CreateSupplyItemRequest request) {
        SupplyItem item = new SupplyItem(request.name(), request.category(), request.unit(), request.stock(), request.minStock(), true);
        SupplyItem saved = supplyItemRepository.save(item);
        movementRepository.save(new InventoryMovement(saved.getId(), saved.getName(), "INITIAL_LOAD", saved.getStock(), null, "Creación de insumo", LocalDateTime.now()));
        return saved;
    }

    public List<SupplyItem> listItems() {
        return supplyItemRepository.findAll();
    }

    public SupplyItem getItem(Long id) {
        return supplyItemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe el insumo con id " + id));
    }

    @Transactional
    public SupplyItem addStock(Long itemId, StockEntryRequest request) {
        SupplyItem item = getItem(itemId);
        item.setStock(item.getStock() + request.quantity());
        movementRepository.save(new InventoryMovement(item.getId(), item.getName(), "ENTRY", request.quantity(), null, request.referenceText(), LocalDateTime.now()));
        return supplyItemRepository.save(item);
    }

    @Transactional
    public StockChangeResponse decreaseStock(InternalStockDecreaseRequest request) {
        SupplyItem item = getItem(request.itemId());
        if (item.getStock() < request.quantity()) {
            throw new BusinessException("Stock insuficiente para el insumo " + item.getName());
        }
        item.setStock(item.getStock() - request.quantity());
        movementRepository.save(new InventoryMovement(item.getId(), item.getName(), "ROOM_ASSIGNMENT", request.quantity(), request.roomNumber(), request.referenceText(), LocalDateTime.now()));
        supplyItemRepository.save(item);
        return new StockChangeResponse(item.getId(), item.getName(), item.getStock(), "Stock descontado correctamente");
    }

    public List<InventoryMovement> listMovements() {
        return movementRepository.findAll();
    }

    public List<SupplyItem> lowStockItems() {
        return supplyItemRepository.findAll().stream()
                .filter(item -> item.getStock() <= item.getMinStock())
                .toList();
    }
}