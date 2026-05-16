package com.hotel.inventory.service;

import com.hotel.inventory.client.RoomClient;
import com.hotel.inventory.dto.CreateSupplyItemRequest;
import com.hotel.inventory.dto.InternalStockDecreaseRequest;
import com.hotel.inventory.dto.RoomValidationResponse;
import com.hotel.inventory.dto.StockChangeResponse;
import com.hotel.inventory.dto.StockEntryRequest;
import com.hotel.inventory.exception.BusinessException;
import com.hotel.inventory.exception.NotFoundException;
import com.hotel.inventory.model.Category;
import com.hotel.inventory.model.InventoryMovement;
import com.hotel.inventory.model.Location;
import com.hotel.inventory.model.Provider;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.model.UnitOfMeasure;
import com.hotel.inventory.repository.InventoryMovementRepository;
import com.hotel.inventory.repository.SupplyItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {
    @Mock
    private SupplyItemRepository supplyItemRepository;

    @Mock
    private InventoryMovementRepository movementRepository;

    @Mock
    private CatalogService catalogService;

    @Mock
    private AuditService auditService;

    @Mock
    private LowStockAlertService lowStockAlertService;

    @Mock
    private RoomClient roomClient;

    @Mock
    private StockLocationService stockLocationService;

    @Mock
    private LocationService locationService;

    @InjectMocks
    private InventoryService inventoryService;

    @Test
    void createItemSavesItemAndInitialMovement() {
        Location bodega = warehouse();
        when(catalogService.ensureActiveCategory("Lenceria")).thenReturn(category("LENCERIA"));
        when(catalogService.ensureActiveUnit("unidad")).thenReturn(unit("UND"));
        when(catalogService.ensureActiveProvider(null)).thenReturn(null);
        when(supplyItemRepository.findAllCodes()).thenReturn(List.of("LEN-001", "ASE-001"));
        when(locationService.requireDefaultWarehouse()).thenReturn(bodega);
        when(supplyItemRepository.save(any(SupplyItem.class))).thenAnswer(invocation -> {
            SupplyItem item = invocation.getArgument(0);
            item.setId(10L);
            return item;
        });
        SupplyItem withStock = supplyItem(10L, "Toallas", 30, 5);
        withStock.setCode("INS-0001");
        when(supplyItemRepository.findById(10L)).thenReturn(Optional.of(withStock));

        SupplyItem created = inventoryService.createItem(
                new CreateSupplyItemRequest("Toallas", null, "Lenceria", "unidad", null, 30, 5, 100),
                "admin"
        );

        assertThat(created.getId()).isEqualTo(10L);
        assertThat(created.getCode()).isEqualTo("INS-0001");
        assertThat(created.getStock()).isEqualTo(30);
        verify(stockLocationService).incrementAt(eq(10L), eq(1L), eq(new BigDecimal("30.000")));
        verify(movementRepository).save(any(InventoryMovement.class));
    }

    @Test
    void createItemIgnoresInvalidOrOverflowingCodesWhenGeneratingSequence() {
        when(catalogService.ensureActiveCategory("Lenceria")).thenReturn(category("LENCERIA"));
        when(catalogService.ensureActiveUnit("unidad")).thenReturn(unit("UND"));
        when(catalogService.ensureActiveProvider(null)).thenReturn(null);
        when(supplyItemRepository.findAllCodes()).thenReturn(Arrays.asList("INS-0007", "abc-1776524030739", "INS-1776524030739", null));
        when(supplyItemRepository.save(any(SupplyItem.class))).thenAnswer(invocation -> {
            SupplyItem item = invocation.getArgument(0);
            item.setId(11L);
            return item;
        });

        SupplyItem created = inventoryService.createItem(
                new CreateSupplyItemRequest("Sabanas", null, "Lenceria", "unidad", null, 0, 2, 50),
                "admin"
        );

        assertThat(created.getCode()).isEqualTo("INS-0008");
        verify(stockLocationService, never()).incrementAt(any(), any(), any());
    }

    @Test
    void addStockIncreasesStockAndRegistersEntryMovement() {
        Location bodega = warehouse();
        SupplyItem item = supplyItem(1L, "Jabon", 7, 3);
        SupplyItem updated = supplyItem(1L, "Jabon", 15, 3);
        when(catalogService.ensureActiveProvider("Proveedor SAS")).thenReturn(provider("Proveedor SAS"));
        when(supplyItemRepository.findById(1L)).thenReturn(Optional.of(item), Optional.of(updated));
        when(locationService.requireDefaultWarehouse()).thenReturn(bodega);

        SupplyItem result = inventoryService.addStock(1L, new StockEntryRequest(8, "Proveedor SAS", "Compra semanal"), "almacen");

        assertThat(result.getStock()).isEqualTo(15);
        verify(stockLocationService).incrementAt(eq(1L), eq(1L), eq(new BigDecimal("8.000")));

        ArgumentCaptor<InventoryMovement> movementCaptor = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(movementCaptor.capture());
        assertThat(movementCaptor.getValue().getMovementType()).isEqualTo("ENTRADA");
        assertThat(movementCaptor.getValue().getQuantity()).isEqualTo(8);
    }

    @Test
    void decreaseStockReturnsResponseWhenStockIsAvailable() {
        Location bodega = warehouse();
        Location hab = roomLocation("HAB_204", "204");
        SupplyItem item = supplyItem(3L, "Shampoo", 12, 4);
        SupplyItem after = supplyItem(3L, "Shampoo", 7, 4);
        when(supplyItemRepository.findById(3L)).thenReturn(Optional.of(item), Optional.of(after));
        when(locationService.requireDefaultWarehouse()).thenReturn(bodega);
        when(stockLocationService.quantityAt(3L, 1L)).thenReturn(new BigDecimal("12.000"));
        when(locationService.resolveRoomLocation("204", "HABITACION")).thenReturn(hab);
        when(roomClient.getRoomByNumber("204"))
                .thenReturn(new RoomValidationResponse(9L, "204", "ESTANDAR", "DISPONIBLE", true));

        StockChangeResponse response = inventoryService.decreaseStock(
                new InternalStockDecreaseRequest(3L, 5, "204", null, "HABITACION", "HABITACION", "Laura", "Reposicion habitacion"),
                "laura",
                true
        );

        assertThat(response.remainingStock()).isEqualTo(7);
        verify(stockLocationService).decrementAt(eq(3L), eq(1L), eq(new BigDecimal("5.000")));
        verify(stockLocationService).incrementAt(eq(3L), eq(2L), eq(new BigDecimal("5.000")));
    }

    @Test
    void decreaseStockThrowsBusinessExceptionWhenStockIsInsufficient() {
        Location bodega = warehouse();
        SupplyItem item = supplyItem(4L, "Almohada", 2, 2);
        when(supplyItemRepository.findById(4L)).thenReturn(Optional.of(item));
        when(locationService.requireDefaultWarehouse()).thenReturn(bodega);
        when(stockLocationService.quantityAt(4L, 1L)).thenReturn(new BigDecimal("2.000"));
        when(roomClient.getRoomByNumber("305"))
                .thenReturn(new RoomValidationResponse(1L, "305", "ESTANDAR", "DISPONIBLE", true));

        assertThatThrownBy(() -> inventoryService.decreaseStock(
                new InternalStockDecreaseRequest(4L, 3, "305", null, "HABITACION", "HABITACION", "Laura", "Reposicion habitacion"),
                "laura",
                true
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Stock insuficiente");

        verify(movementRepository, never()).save(any());
        verify(stockLocationService, never()).decrementAt(any(), any(), any());
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
        when(supplyItemRepository.findLowStockItems()).thenReturn(List.of(low, exact));

        List<SupplyItem> result = inventoryService.lowStockItems();

        assertThat(result).containsExactly(low, exact);
    }

    private static Location warehouse() {
        Location location = new Location("BODEGA_PRINCIPAL", "Bodega", Location.Type.BODEGA, null, null, null, true);
        location.setId(1L);
        return location;
    }

    private static Location roomLocation(String code, String roomNumber) {
        Location location = new Location(code, "Hab", Location.Type.HABITACION, null, roomNumber, null, true);
        location.setId(2L);
        return location;
    }

    private static SupplyItem supplyItem(Long id, String name, Integer stock, Integer minStock) {
        SupplyItem item = new SupplyItem(name, category("CATEGORIA"), unit("UND"), stock, minStock, true);
        item.setId(id);
        return item;
    }

    private static Category category(String code) {
        return new Category(code, code, true);
    }

    private static UnitOfMeasure unit(String code) {
        return new UnitOfMeasure(code, code, code, true);
    }

    private static Provider provider(String name) {
        return new Provider("PRO-9999", "900001999", name, null, null, true);
    }
}
