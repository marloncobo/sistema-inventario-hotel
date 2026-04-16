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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {
    @Mock
    private SupplyItemRepository supplyItemRepository;

    @Mock
    private InventoryMovementRepository movementRepository;

    @InjectMocks
    private InventoryService inventoryService;

    @Test
    void createItemSavesItemAndInitialMovement() {
        when(supplyItemRepository.save(any(SupplyItem.class))).thenAnswer(invocation -> {
            SupplyItem item = invocation.getArgument(0);
            item.setId(10L);
            return item;
        });

        SupplyItem created = inventoryService.createItem(
                new CreateSupplyItemRequest("LEN-100", "Toallas", null, "Lenceria", "unidad", null, 30, 5, 100)
        );

        assertThat(created.getId()).isEqualTo(10L);
        assertThat(created.getName()).isEqualTo("Toallas");
        assertThat(created.getStock()).isEqualTo(30);
        assertThat(created.getActive()).isTrue();

        ArgumentCaptor<InventoryMovement> movementCaptor = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(movementCaptor.capture());

        InventoryMovement movement = movementCaptor.getValue();
        assertThat(movement.getItemId()).isEqualTo(10L);
        assertThat(movement.getItemName()).isEqualTo("Toallas");
        assertThat(movement.getMovementType()).isEqualTo("ENTRADA");
        assertThat(movement.getQuantity()).isEqualTo(30);
        assertThat(movement.getCreatedAt()).isNotNull();
    }

    @Test
    void addStockIncreasesStockAndRegistersEntryMovement() {
        SupplyItem item = supplyItem(1L, "Jabon", 7, 3);
        when(supplyItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(supplyItemRepository.save(item)).thenReturn(item);

        SupplyItem updated = inventoryService.addStock(1L, new StockEntryRequest(8, null, "Almacen", "Compra semanal"));

        assertThat(updated.getStock()).isEqualTo(15);

        ArgumentCaptor<InventoryMovement> movementCaptor = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(movementCaptor.capture());

        InventoryMovement movement = movementCaptor.getValue();
        assertThat(movement.getMovementType()).isEqualTo("ENTRADA");
        assertThat(movement.getQuantity()).isEqualTo(8);
        assertThat(movement.getReferenceText()).isEqualTo("Compra semanal");
    }

    @Test
    void decreaseStockReturnsResponseWhenStockIsAvailable() {
        SupplyItem item = supplyItem(3L, "Shampoo", 12, 4);
        when(supplyItemRepository.findById(3L)).thenReturn(Optional.of(item));
        when(supplyItemRepository.save(item)).thenReturn(item);

        StockChangeResponse response = inventoryService.decreaseStock(
                new InternalStockDecreaseRequest(3L, 5, "204", null, "HABITACION", "Laura", "Reposicion habitacion")
        );

        assertThat(response.itemId()).isEqualTo(3L);
        assertThat(response.itemName()).isEqualTo("Shampoo");
        assertThat(response.remainingStock()).isEqualTo(7);
        assertThat(item.getStock()).isEqualTo(7);

        ArgumentCaptor<InventoryMovement> movementCaptor = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(movementCaptor.capture());
        assertThat(movementCaptor.getValue().getMovementType()).isEqualTo("SALIDA");
        assertThat(movementCaptor.getValue().getRoomNumber()).isEqualTo("204");
    }

    @Test
    void decreaseStockThrowsBusinessExceptionWhenStockIsInsufficient() {
        SupplyItem item = supplyItem(4L, "Almohada", 2, 2);
        when(supplyItemRepository.findById(4L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> inventoryService.decreaseStock(
                new InternalStockDecreaseRequest(4L, 3, "305", null, "HABITACION", "Laura", "Reposicion habitacion")
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Stock insuficiente");

        assertThat(item.getStock()).isEqualTo(2);
        verify(movementRepository, never()).save(any());
        verify(supplyItemRepository, never()).save(any());
    }

    @Test
    void getItemThrowsNotFoundExceptionWhenItemDoesNotExist() {
        when(supplyItemRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.getItem(99L))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void lowStockItemsReturnsItemsAtOrBelowMinimumStock() {
        SupplyItem low = supplyItem(1L, "Papel", 4, 5);
        SupplyItem exact = supplyItem(2L, "Agua", 10, 10);
        SupplyItem healthy = supplyItem(3L, "Cafe", 20, 8);
        when(supplyItemRepository.findLowStockItems()).thenReturn(List.of(low, exact));

        List<SupplyItem> result = inventoryService.lowStockItems();

        assertThat(result).containsExactly(low, exact);
    }

    private static SupplyItem supplyItem(Long id, String name, Integer stock, Integer minStock) {
        SupplyItem item = new SupplyItem(name, "Categoria", "unidad", stock, minStock, true);
        item.setId(id);
        return item;
    }
}
