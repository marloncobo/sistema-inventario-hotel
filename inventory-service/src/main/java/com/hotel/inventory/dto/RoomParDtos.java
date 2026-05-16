package com.hotel.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class RoomParDtos {
    private RoomParDtos() {}

    public record CreateRoomParRequest(
            @NotBlank @Size(max = 30) String roomType,
            @NotBlank @Size(max = 30) String scope,
            @NotBlank @Size(max = 120) String name,
            Boolean active,
            @NotEmpty List<RoomParLineRequest> lines
    ) {}

    public record UpdateRoomParRequest(
            @NotBlank @Size(max = 120) String name,
            Boolean active,
            @NotEmpty List<RoomParLineRequest> lines
    ) {}

    public record RoomParLineRequest(
            @NotNull Long itemId,
            @NotNull @Min(0) Integer targetQuantity,
            Boolean mandatory,
            @Size(max = 300) String notes
    ) {}

    public record RoomParComparisonLine(
            Long itemId,
            String itemCode,
            String itemName,
            int targetQuantity,
            int actualQuantity,
            int gapQuantity,
            String status,
            boolean mandatory
    ) {}

    public record RoomParComparisonView(
            String roomNumber,
            String roomType,
            String scope,
            Long locationId,
            String locationCode,
            String locationName,
            String overallStatus,
            List<RoomParComparisonLine> lines
    ) {}

    public record ReplenishmentSuggestion(
            String roomNumber,
            String roomType,
            String scope,
            Long locationId,
            String locationCode,
            Long itemId,
            String itemCode,
            String itemName,
            int targetQuantity,
            int actualQuantity,
            int suggestedQuantity,
            int availableAtBodega,
            String priority
    ) {}
}
