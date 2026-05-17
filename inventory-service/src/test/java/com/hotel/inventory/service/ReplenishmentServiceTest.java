package com.hotel.inventory.service;

import com.hotel.inventory.client.RoomClient;
import com.hotel.inventory.dto.RoomParDtos.ReplenishmentSuggestion;
import com.hotel.inventory.dto.RoomParDtos.RoomParComparisonLine;
import com.hotel.inventory.dto.RoomParDtos.RoomParComparisonView;
import com.hotel.inventory.dto.RoomValidationResponse;
import com.hotel.inventory.model.Location;
import com.hotel.inventory.model.RoomPar;
import com.hotel.inventory.repository.LocationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReplenishmentServiceTest {

    @Mock
    private RoomParService roomParService;
    @Mock
    private LocationRepository locationRepository;
    @Mock
    private StockLocationService stockLocationService;
    @Mock
    private LocationService locationService;
    @Mock
    private RoomClient roomClient;

    @InjectMocks
    private ReplenishmentService replenishmentService;

    @Test
    void suggestionsForSingleRoomUsesParComparison() {
        Location bodega = new Location("BODEGA_PRINCIPAL", "Bodega", Location.Type.BODEGA, null, null, null, true);
        bodega.setId(1L);
        when(locationService.requireDefaultWarehouse()).thenReturn(bodega);
        when(roomParService.compareRoom("101", RoomPar.Scope.HABITACION)).thenReturn(
                new RoomParComparisonView(
                        "101", "ESTANDAR", RoomPar.Scope.HABITACION,
                        50L, "HAB_101", "Habitación 101", "FALTA",
                        List.of(new RoomParComparisonLine(
                                10L, "ASE-001", "Shampoo", 2, 0, 2, "FALTA", true))
                )
        );
        when(stockLocationService.quantityAt(10L, 1L)).thenReturn(new BigDecimal("5.000"));

        List<ReplenishmentSuggestion> suggestions =
                replenishmentService.suggestions("101", RoomPar.Scope.HABITACION, null);

        assertThat(suggestions).hasSize(1);
        assertThat(suggestions.get(0).suggestedQuantity()).isEqualTo(2);
        assertThat(suggestions.get(0).priority()).isEqualTo("ALTA");
        verify(locationRepository, never()).findByTypeAndActiveTrue(any());
    }

    @Test
    void suggestionsFilterLocationsByRoomTypeFromRoomsService() {
        Location bodega = new Location("BODEGA_PRINCIPAL", "Bodega", Location.Type.BODEGA, null, null, null, true);
        bodega.setId(1L);
        Location hab101 = new Location("HAB_101", "Hab 101", Location.Type.HABITACION, null, "101", null, true);
        Location hab102 = new Location("HAB_102", "Hab 102", Location.Type.HABITACION, null, "102", null, true);

        when(locationService.requireDefaultWarehouse()).thenReturn(bodega);
        when(locationRepository.findByTypeAndActiveTrue(Location.Type.HABITACION))
                .thenReturn(List.of(hab101, hab102));
        when(roomClient.getRoomByNumber("101")).thenReturn(new RoomValidationResponse(1L, "101", "ESTANDAR", "DISPONIBLE", true));
        when(roomClient.getRoomByNumber("102")).thenReturn(new RoomValidationResponse(2L, "102", "EJECUTIVA", "DISPONIBLE", true));
        when(roomParService.compareRoom(eq("101"), eq(RoomPar.Scope.HABITACION))).thenReturn(
                comparison("101", "ESTANDAR", 10L, 1)
        );
        when(stockLocationService.quantityAt(10L, 1L)).thenReturn(new BigDecimal("3.000"));

        List<ReplenishmentSuggestion> suggestions =
                replenishmentService.suggestions(null, RoomPar.Scope.HABITACION, "ESTANDAR");

        assertThat(suggestions).hasSize(1);
        assertThat(suggestions.get(0).roomNumber()).isEqualTo("101");
        verify(roomParService, never()).compareRoom(eq("102"), any());
    }

    private static RoomParComparisonView comparison(String roomNumber, String roomType, Long itemId, int gap) {
        return new RoomParComparisonView(
                roomNumber, roomType, RoomPar.Scope.HABITACION,
                50L, "HAB_" + roomNumber, "Habitación " + roomNumber, "FALTA",
                List.of(new RoomParComparisonLine(
                        itemId, "ASE-001", "Shampoo", 2, 0, gap, "FALTA", true))
        );
    }
}
