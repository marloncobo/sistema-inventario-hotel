package com.hotel.ai.service;

import com.hotel.ai.dto.AppUserDto;
import com.hotel.ai.dto.InventoryItemDto;
import com.hotel.ai.dto.InventoryMovementDto;
import com.hotel.ai.dto.InventorySummaryDto;
import com.hotel.ai.dto.LowStockAlertDto;
import com.hotel.ai.dto.RoomConsumptionDto;
import com.hotel.ai.dto.RoomDistributionDto;
import com.hotel.ai.dto.RoomDto;
import com.hotel.ai.dto.SimpleAreaDto;
import com.hotel.ai.dto.SimpleCategoryDto;
import com.hotel.ai.dto.SimpleProviderDto;
import com.hotel.ai.dto.TopUsedItemDto;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

/**
 * Filtra el contexto de inventario según el rol del usuario.
 * Cada rol tiene acceso a diferentes datos.
 */
@Service
public class RoleBasedContextFilter {

    public FilteredContextSnapshot filterContextByRole(
            ContextSnapshot fullContext,
            String userRole) {

        return switch (userRole.toUpperCase()) {
            case "ADMIN" -> filterForAdmin(fullContext);
            case "ALMACENISTA" -> filterForAlmacenista(fullContext);
            case "SERVICIO" -> filterForServicio(fullContext);
            case "RECEPCION" -> filterForRecepcion(fullContext);
            default -> filterForRecepcion(fullContext);
        };
    }

    private FilteredContextSnapshot filterForAdmin(ContextSnapshot context) {
        return new FilteredContextSnapshot(
                context.items(),
                context.lowStockItems(),
                context.recentMovements(),
                context.topUsedItems(),
                context.inventoryReport(),
                context.alerts(),
                context.providers(),
                context.categories(),
                context.areas(),
                context.rooms(),
                context.roomConsumption(),
                context.roomDistribution(),
                context.users()
        );
    }

    private FilteredContextSnapshot filterForAlmacenista(ContextSnapshot context) {
        List<SimpleAreaDto> almacenAreas = context.areas().stream()
                .filter(this::isWarehouseArea)
                .toList();

        return new FilteredContextSnapshot(
                context.items(),
                context.lowStockItems(),
                context.recentMovements(),
                context.topUsedItems(),
                context.inventoryReport(),
                context.alerts(),
                context.providers(),
                context.categories(),
                almacenAreas,
                List.of(),
                List.of(),
                List.of(),
                List.of()
        );
    }

    private FilteredContextSnapshot filterForServicio(ContextSnapshot context) {
        List<InventoryItemDto> serviceItems = context.items().stream()
                .filter(this::isServiceProduct)
                .toList();

        List<InventoryMovementDto> userMovements = context.recentMovements().stream()
                .filter(this::isServiceMovement)
                .toList();

        List<TopUsedItemDto> serviceTopUsed = context.topUsedItems().stream()
                .filter(this::isServiceTopUsedProduct)
                .toList();

        return new FilteredContextSnapshot(
                serviceItems,
                List.of(),
                userMovements,
                serviceTopUsed,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                context.roomConsumption(),
                context.roomDistribution(),
                List.of()
        );
    }

    private FilteredContextSnapshot filterForRecepcion(ContextSnapshot context) {
        List<AppUserDto> basicUsers = context.users().stream()
                .map(this::stripUserDetails)
                .filter(Objects::nonNull)
                .toList();

        return new FilteredContextSnapshot(
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                context.rooms(),
                context.roomConsumption(),
                List.of(),
                basicUsers
        );
    }

    // ===== Métodos auxiliares =====

    private boolean isWarehouseArea(SimpleAreaDto area) {
        if (area == null || area.getName() == null) {
            return false;
        }
        String name = area.getName().toUpperCase();
        return name.contains("BODEGA") || name.contains("ALMACEN") ||
               name.contains("WAREHOUSE") || name.contains("STORAGE");
    }

    private boolean isServiceProduct(InventoryItemDto item) {
        if (item == null || item.getCategory() == null) {
            return false;
        }
        String category = item.getCategory().toUpperCase();
        return category.contains("ASEO") || category.contains("LIMPIEZA") ||
               category.contains("MINIBAR") || category.contains("TOILETRIES");
    }

    private boolean isServiceTopUsedProduct(TopUsedItemDto item) {
        if (item == null || item.getItemName() == null) {
            return false;
        }
        String itemName = item.getItemName().toUpperCase();
        return itemName.contains("ASEO") || itemName.contains("LIMPIEZA") ||
               itemName.contains("MINIBAR") || itemName.contains("TOALLA") ||
               itemName.contains("JABON") || itemName.contains("PAPEL");
    }

    private boolean isServiceMovement(InventoryMovementDto movement) {
        if (movement == null || movement.getMovementType() == null) {
            return false;
        }
        String type = movement.getMovementType().toUpperCase();
        return type.contains("SALIDA") || type.contains("DEVOLUCION") ||
               type.contains("ROOM") || type.contains("RETURN");
    }

    private AppUserDto stripUserDetails(AppUserDto user) {
        if (user == null) {
            return null;
        }
        AppUserDto stripped = new AppUserDto();
        stripped.setId(user.getId());
        stripped.setUsername(user.getUsername());
        stripped.setRoles(user.getRoles());
        stripped.setActive(user.getActive());
        return stripped;
    }

    public record ContextSnapshot(
            List<InventoryItemDto> items,
            List<InventoryItemDto> lowStockItems,
            List<InventoryMovementDto> recentMovements,
            List<TopUsedItemDto> topUsedItems,
            List<InventorySummaryDto> inventoryReport,
            List<LowStockAlertDto> alerts,
            List<SimpleProviderDto> providers,
            List<SimpleCategoryDto> categories,
            List<SimpleAreaDto> areas,
            List<RoomDto> rooms,
            List<RoomConsumptionDto> roomConsumption,
            List<RoomDistributionDto> roomDistribution,
            List<AppUserDto> users
    ) {
    }

    public record FilteredContextSnapshot(
            List<InventoryItemDto> items,
            List<InventoryItemDto> lowStockItems,
            List<InventoryMovementDto> recentMovements,
            List<TopUsedItemDto> topUsedItems,
            List<InventorySummaryDto> inventoryReport,
            List<LowStockAlertDto> alerts,
            List<SimpleProviderDto> providers,
            List<SimpleCategoryDto> categories,
            List<SimpleAreaDto> areas,
            List<RoomDto> rooms,
            List<RoomConsumptionDto> roomConsumption,
            List<RoomDistributionDto> roomDistribution,
            List<AppUserDto> users
    ) {
    }
}
