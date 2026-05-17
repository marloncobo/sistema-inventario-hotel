package com.hotel.inventory.service;

import com.hotel.inventory.client.RoomClient;
import com.hotel.inventory.dto.RoomParDtos.CreateRoomParRequest;
import com.hotel.inventory.dto.RoomParDtos.RoomParComparisonView;
import com.hotel.inventory.dto.RoomParDtos.RoomParLineRequest;
import com.hotel.inventory.dto.RoomParDtos.UpdateRoomParRequest;
import com.hotel.inventory.dto.RoomValidationResponse;
import com.hotel.inventory.exception.BusinessException;
import com.hotel.inventory.model.Location;
import com.hotel.inventory.model.RoomPar;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.repository.RoomParRepository;
import com.hotel.inventory.repository.SupplyItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoomParServiceTest {

    @Mock
    private RoomParRepository roomParRepository;
    @Mock
    private SupplyItemRepository itemRepository;
    @Mock
    private LocationService locationService;
    @Mock
    private StockLocationService stockLocationService;
    @Mock
    private RoomClient roomClient;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private RoomParService roomParService;

    @Test
    void createPersistsParAndAudits() {
        SupplyItem shampoo = item(1L, "ASE-001", "Shampoo");
        when(roomParRepository.existsByRoomTypeAndScopeIgnoreCase("ESTANDAR", "HABITACION")).thenReturn(false);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(shampoo));
        when(roomParRepository.save(any(RoomPar.class))).thenAnswer(invocation -> {
            RoomPar par = invocation.getArgument(0);
            par.setId(5L);
            return par;
        });

        RoomPar created = roomParService.create(
                new CreateRoomParRequest(
                        "estandar",
                        "habitacion",
                        "PAR estándar",
                        true,
                        List.of(new RoomParLineRequest(1L, 2, true, null))
                ),
                "admin"
        );

        assertThat(created.getId()).isEqualTo(5L);
        assertThat(created.getRoomType()).isEqualTo("ESTANDAR");
        assertThat(created.getScope()).isEqualTo("HABITACION");
        assertThat(created.getLines()).hasSize(1);
        verify(auditService).record("CREATE", "RoomPar", 5L, "admin", "PAR estándar");
    }

    @Test
    void createRejectsDuplicateRoomTypeAndScope() {
        when(roomParRepository.existsByRoomTypeAndScopeIgnoreCase("ESTANDAR", "HABITACION")).thenReturn(true);

        assertThatThrownBy(() -> roomParService.create(
                new CreateRoomParRequest(
                        "ESTANDAR",
                        "HABITACION",
                        "Duplicado",
                        true,
                        List.of(new RoomParLineRequest(1L, 1, true, null))
                ),
                "admin"
        )).isInstanceOf(BusinessException.class)
                .hasMessageContaining("Ya existe un PAR");
    }

    @Test
    void createRejectsInvalidScope() {
        assertThatThrownBy(() -> roomParService.create(
                new CreateRoomParRequest(
                        "ESTANDAR",
                        "INVALIDO",
                        "PAR",
                        true,
                        List.of(new RoomParLineRequest(1L, 1, true, null))
                ),
                "admin"
        )).isInstanceOf(BusinessException.class)
                .hasMessageContaining("Ámbito PAR no válido");
    }

    @Test
    void updateReplacesLines() {
        SupplyItem towel = item(2L, "LEN-001", "Toalla");
        RoomPar existing = par(3L, "ESTANDAR", "HABITACION", "PAR habitación");
        when(roomParRepository.findByIdWithLines(3L)).thenReturn(Optional.of(existing));
        when(itemRepository.findById(2L)).thenReturn(Optional.of(towel));
        when(roomParRepository.save(any(RoomPar.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RoomPar updated = roomParService.update(
                3L,
                new UpdateRoomParRequest(
                        "PAR actualizado",
                        false,
                        List.of(new RoomParLineRequest(2L, 4, false, "Extra"))
                ),
                "almacen"
        );

        assertThat(updated.getName()).isEqualTo("PAR actualizado");
        assertThat(updated.getActive()).isFalse();
        assertThat(updated.getLines()).hasSize(1);
        assertThat(updated.getLines().get(0).getTargetQuantity()).isEqualTo(4);
        verify(auditService).record("UPDATE", "RoomPar", 3L, "almacen", "PAR actualizado");
    }

    @Test
    void compareRoomReportsShortageWhenStockBelowPar() {
        RoomPar par = par(1L, "ESTANDAR", "HABITACION", "PAR demo");
        SupplyItem shampoo = item(10L, "ASE-001", "Shampoo");
        par.addLine(new com.hotel.inventory.model.RoomParLine(shampoo, 2, true, null));

        Location hab = new Location("HAB_101", "Habitación 101", Location.Type.HABITACION, null, "101", null, true);
        hab.setId(50L);

        when(roomClient.getRoomByNumber("101")).thenReturn(new RoomValidationResponse(1L, "101", "ESTANDAR", "DISPONIBLE", true));
        when(roomParRepository.findByRoomTypeAndScopeAndActiveTrue("ESTANDAR", "HABITACION"))
                .thenReturn(Optional.of(par));
        when(locationService.resolveRoomLocation("101", "HABITACION")).thenReturn(hab);
        when(stockLocationService.quantityAt(10L, 50L)).thenReturn(BigDecimal.ONE);

        RoomParComparisonView view = roomParService.compareRoom("101", "HABITACION");

        assertThat(view.roomNumber()).isEqualTo("101");
        assertThat(view.overallStatus()).isEqualTo("FALTA");
        assertThat(view.lines()).hasSize(1);
        assertThat(view.lines().get(0).gapQuantity()).isEqualTo(1);
        assertThat(view.lines().get(0).status()).isEqualTo("FALTA");
    }

    @Test
    void compareRoomFailsWhenNoActivePar() {
        when(roomClient.getRoomByNumber("101")).thenReturn(new RoomValidationResponse(1L, "101", "ESTANDAR", "DISPONIBLE", true));
        when(roomParRepository.findByRoomTypeAndScopeAndActiveTrue("ESTANDAR", "MINIBAR"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> roomParService.compareRoom("101", "MINIBAR"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No hay PAR activo");
    }

    private static RoomPar par(Long id, String roomType, String scope, String name) {
        RoomPar par = new RoomPar(roomType, scope, name, true);
        par.setId(id);
        return par;
    }

    private static SupplyItem item(Long id, String code, String name) {
        SupplyItem item = new SupplyItem();
        item.setId(id);
        item.setCode(code);
        item.setName(name);
        item.setActive(true);
        item.setStock(0);
        return item;
    }
}
