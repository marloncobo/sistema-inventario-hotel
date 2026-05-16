package com.hotel.inventory.service;

import com.hotel.inventory.client.RoomClient;
import com.hotel.inventory.dto.RoomParDtos.ReplenishmentSuggestion;
import com.hotel.inventory.dto.RoomParDtos.RoomParComparisonLine;
import com.hotel.inventory.dto.RoomParDtos.RoomParComparisonView;
import com.hotel.inventory.dto.RoomValidationResponse;
import com.hotel.inventory.model.Location;
import com.hotel.inventory.model.RoomPar;
import com.hotel.inventory.repository.LocationRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class ReplenishmentService {

    private final RoomParService roomParService;
    private final LocationRepository locationRepository;
    private final StockLocationService stockLocationService;
    private final LocationService locationService;
    private final RoomClient roomClient;

    public ReplenishmentService(RoomParService roomParService,
                                LocationRepository locationRepository,
                                StockLocationService stockLocationService,
                                LocationService locationService,
                                RoomClient roomClient) {
        this.roomParService = roomParService;
        this.locationRepository = locationRepository;
        this.stockLocationService = stockLocationService;
        this.locationService = locationService;
        this.roomClient = roomClient;
    }

    /**
     * Sugerencias de reposición: habitaciones con faltante PAR y stock disponible en bodega.
     */
    public List<ReplenishmentSuggestion> suggestions(String roomNumber, String scope, String roomType) {
        List<ReplenishmentSuggestion> result = new ArrayList<>();
        Location bodega = locationService.requireDefaultWarehouse();
        Long bodegaId = bodega.getId();

        if (roomNumber != null && !roomNumber.isBlank()) {
            String sc = scope == null || scope.isBlank() ? RoomPar.Scope.HABITACION : scope.trim().toUpperCase(Locale.ROOT);
            result.addAll(suggestionsForRoom(roomNumber.trim(), sc, bodegaId));
            return sort(result);
        }

        String locationType = mapScopeToLocationType(scope);
        List<Location> locations = locationRepository.findByTypeAndActiveTrue(locationType).stream()
                .filter(loc -> loc.getRoomNumber() != null && !loc.getRoomNumber().isBlank())
                .filter(loc -> roomType == null || roomType.isBlank()
                        || matchesRoomType(loc.getRoomNumber(), roomType))
                .toList();

        for (Location loc : locations) {
            String parScope = mapLocationTypeToScope(loc.getType());
            try {
                result.addAll(suggestionsForRoom(loc.getRoomNumber(), parScope, bodegaId));
            } catch (Exception ignored) {
                // Sin PAR o habitación inválida: omitir
            }
        }
        return sort(result);
    }

    private List<ReplenishmentSuggestion> suggestionsForRoom(String roomNumber, String scope, Long bodegaId) {
        List<ReplenishmentSuggestion> list = new ArrayList<>();
        RoomParComparisonView comparison = roomParService.compareRoom(roomNumber, scope);
        for (RoomParComparisonLine line : comparison.lines()) {
            if (line.gapQuantity() <= 0) {
                continue;
            }
            BigDecimal bodegaQty = stockLocationService.quantityAt(line.itemId(), bodegaId);
            int available = bodegaQty == null ? 0 : bodegaQty.intValue();
            int suggested = Math.min(line.gapQuantity(), available);
            String priority = line.mandatory() ? "ALTA" : "MEDIA";
            if (available == 0) {
                priority = "SIN_STOCK_BODEGA";
            }
            list.add(new ReplenishmentSuggestion(
                    comparison.roomNumber(),
                    comparison.roomType(),
                    comparison.scope(),
                    comparison.locationId(),
                    comparison.locationCode(),
                    line.itemId(),
                    line.itemCode(),
                    line.itemName(),
                    line.targetQuantity(),
                    line.actualQuantity(),
                    suggested,
                    available,
                    priority
            ));
        }
        return list;
    }

    private boolean matchesRoomType(String roomNumber, String roomTypeFilter) {
        if (roomTypeFilter == null || roomTypeFilter.isBlank()) {
            return true;
        }
        try {
            RoomValidationResponse room = roomClient.getRoomByNumber(roomNumber);
            return room != null
                    && Boolean.TRUE.equals(room.active())
                    && roomTypeFilter.equalsIgnoreCase(room.type());
        } catch (Exception ex) {
            return false;
        }
    }

    private List<ReplenishmentSuggestion> sort(List<ReplenishmentSuggestion> list) {
        return list.stream()
                .sorted(Comparator
                        .comparing(ReplenishmentSuggestion::priority)
                        .thenComparing(ReplenishmentSuggestion::roomNumber)
                        .thenComparing(ReplenishmentSuggestion::itemName))
                .toList();
    }

    private String mapScopeToLocationType(String scope) {
        if (scope == null || scope.isBlank()) {
            return Location.Type.HABITACION;
        }
        return switch (scope.trim().toUpperCase(Locale.ROOT)) {
            case RoomPar.Scope.MINIBAR -> Location.Type.MINIBAR;
            default -> Location.Type.HABITACION;
        };
    }

    private String mapLocationTypeToScope(String locationType) {
        if (Location.Type.MINIBAR.equals(locationType)) {
            return RoomPar.Scope.MINIBAR;
        }
        return RoomPar.Scope.HABITACION;
    }
}
