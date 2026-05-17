package com.hotel.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.ai.client.GatewayClient;
import com.hotel.ai.client.InventoryClient;
import com.hotel.ai.client.RoomsClient;
import com.hotel.ai.dto.AppUserDto;
import com.hotel.ai.dto.InventoryAssistantRequest;
import com.hotel.ai.dto.InventoryAssistantResponse;
import com.hotel.ai.dto.InventoryContextDto;
import com.hotel.ai.dto.InventoryItemDto;
import com.hotel.ai.dto.InventoryMovementDto;
import com.hotel.ai.dto.InventorySummaryDto;
import com.hotel.ai.dto.LowStockAlertDto;
import com.hotel.ai.dto.RoleContextInfo;
import com.hotel.ai.dto.RoomConsumptionDto;
import com.hotel.ai.dto.RoomDistributionDto;
import com.hotel.ai.dto.RoomDto;
import com.hotel.ai.dto.SimpleAreaDto;
import com.hotel.ai.dto.SimpleCategoryDto;
import com.hotel.ai.dto.SimpleProviderDto;
import com.hotel.ai.dto.TopUsedItemDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * Servicio de asistente de inventario con soporte para control de acceso basado en roles (RBAC).
 * Filtra contexto y adapta prompts según el rol del usuario.
 */
@Service
public class InventoryAssistantService {
    // Instrucción por defecto (antigua - se reemplaza con instrucciones por rol)
    private static final String AI_INSTRUCTIONS = """
            Eres un asistente de inventario para un hotel.
            Responde siempre en espanol claro y accionable.
            Usa solo el contexto entregado en la solicitud.
            Si algun bloque del contexto llega vacio, asume que no estuvo disponible o no era accesible con los permisos del usuario.
            No inventes stock, movimientos, proveedores, areas, habitaciones, usuarios, roles ni productos que no aparecen en el contexto.
            Prioriza recomendaciones practicas sobre reabastecimiento, riesgo de agotamiento, consumo, alertas, operacion de habitaciones y resumen administrativo.
            Cuando hables de consumo promedio, basate en el periodo de 30 dias incluido en el contexto.
            """;
    private static final int RECENT_MOVEMENTS_LIMIT = 15;
    private static final int TOP_USED_LIMIT = 10;
    private static final int REPLENISHMENT_LIMIT = 8;
    private static final int AVERAGE_CONSUMPTION_DAYS = 30;
    private static final int ROOM_CONSUMPTION_LIMIT = 12;
    private static final int ROOM_DISTRIBUTION_LIMIT = 12;

    private final InventoryClient inventoryClient;
    private final RoomsClient roomsClient;
    private final GatewayClient gatewayClient;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;
    private final RoleBasedContextFilter contextFilter;
    private final RoleBasedPromptBuilder promptBuilder;

    public InventoryAssistantService(InventoryClient inventoryClient,
                                     RoomsClient roomsClient,
                                     GatewayClient gatewayClient,
                                     GeminiClient geminiClient,
                                     ObjectMapper objectMapper,
                                     RoleBasedContextFilter contextFilter,
                                     RoleBasedPromptBuilder promptBuilder) {
        this.inventoryClient = inventoryClient;
        this.roomsClient = roomsClient;
        this.gatewayClient = gatewayClient;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
        this.contextFilter = contextFilter;
        this.promptBuilder = promptBuilder;
    }

    /**
     * Responde una pregunta de inventario adaptando el contexto y prompt según el rol del usuario.
     *
     * @param request solicitud con la pregunta del usuario
     * @param roleContext contexto de rol del usuario autenticado
     * @return respuesta del asistente adaptada al rol
     */
    public InventoryAssistantResponse answerInventoryQuestion(
            InventoryAssistantRequest request,
            RoleContextInfo roleContext) {

        // 1. Cargar contexto completo
        InventorySnapshot fullSnapshot = loadContext(request.getInventoryContext());

        // 2. Filtrar contexto según rol del usuario
        RoleBasedContextFilter.InventoryContextSnapshot filteredContext =
                filterContextByRole(fullSnapshot, roleContext.role());

        // 3. Construir prompt adaptado al rol
        String aiInstructions = promptBuilder.getAiInstructionsForRole(roleContext.role());
        String prompt = buildPromptWithFilteredContext(request.getQuestion(), filteredContext);

        // 4. Obtener respuesta de Gemini
        String answer = geminiClient.generateInventoryAnswer(aiInstructions, prompt);

        // 5. Retornar respuesta con metadata
        return new InventoryAssistantResponse(answer, fullSnapshot.contextSource());
    }

    /**
     * Versión antigua del método (mantiene compatibilidad hacia atrás)
     */
    public InventoryAssistantResponse answerInventoryQuestion(InventoryAssistantRequest request) {
        InventorySnapshot snapshot = loadContext(request.getInventoryContext());
        String prompt = buildPrompt(request.getQuestion(), snapshot);
        String answer = geminiClient.generateInventoryAnswer(AI_INSTRUCTIONS, prompt);
        return new InventoryAssistantResponse(answer, snapshot.contextSource());
    }

    /**
     * Filtra el contexto de inventario según el rol del usuario.
     */
    private RoleBasedContextFilter.FilteredContextSnapshot filterContextByRole(
            InventorySnapshot fullSnapshot,
            String userRole) {

        RoleBasedContextFilter.ContextSnapshot snapshot =
                new RoleBasedContextFilter.ContextSnapshot(
                        fullSnapshot.items(),
                        fullSnapshot.lowStockItems(),
                        fullSnapshot.recentMovements(),
                        fullSnapshot.topUsedItems(),
                        fullSnapshot.inventoryReport(),
                        fullSnapshot.alerts(),
                        fullSnapshot.providers(),
                        fullSnapshot.categories(),
                        fullSnapshot.areas(),
                        fullSnapshot.rooms(),
                        fullSnapshot.roomConsumption(),
                        fullSnapshot.roomDistribution(),
                        fullSnapshot.users()
                );

        return contextFilter.filterContextByRole(snapshot, userRole);
    }

    /**
     * Construye el prompt a partir del contexto filtrado por rol.
     */
    private String buildPromptWithFilteredContext(
            String question,
            RoleBasedContextFilter.FilteredContextSnapshot filteredContext) {

        // Convertir el snapshot filtrado a un snapshot completo con datos vacíos donde corresponda
        InventorySnapshot snapshot = new InventorySnapshot(
                filteredContext.items(),
                filteredContext.lowStockItems(),
                filteredContext.recentMovements(),
                filteredContext.topUsedItems(),
                filteredContext.inventoryReport(),
                filteredContext.alerts(),
                filteredContext.providers(),
                filteredContext.categories(),
                filteredContext.areas(),
                filteredContext.rooms(),
                filteredContext.roomConsumption(),
                filteredContext.roomDistribution(),
                filteredContext.users(),
                contextSourceForFilteredContext(filteredContext)
        );

        // Usar el método existente buildPrompt
        return buildPrompt(question, snapshot);
    }

    /**
     * Determina la fuente del contexto para un snapshot filtrado.
     */
    private String contextSourceForFilteredContext(
            RoleBasedContextFilter.FilteredContextSnapshot context) {
        LinkedHashSet<String> sources = new LinkedHashSet<>();
        if (hasAny(context.items(), context.lowStockItems(), context.recentMovements(),
                   context.topUsedItems(), context.inventoryReport(), context.alerts(),
                   context.providers(), context.categories(), context.areas())) {
            sources.add("inventory-service");
        }
        if (hasAny(context.rooms(), context.roomConsumption(), context.roomDistribution())) {
            sources.add("rooms-service");
        }
        if (hasAny(context.users())) {
            sources.add("gateway-service");
        }
        return sources.isEmpty() ? "no-context" : String.join(", ", sources);
    }

    private InventorySnapshot loadContext(InventoryContextDto requestContext) {
        if (requestContext != null && requestContext.getItems() != null && !requestContext.getItems().isEmpty()) {
            List<InventoryItemDto> items = sanitizeItems(requestContext.getItems());
            return new InventorySnapshot(
                    items,
                    detectLowStock(items),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    "request"
            );
        }

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(AVERAGE_CONSUMPTION_DAYS - 1L);

        List<InventoryItemDto> items = sanitizeItems(inventoryClient.listItems());
        List<InventoryItemDto> lowStockItems = sanitizeItems(inventoryClient.lowStockItems());
        List<InventoryMovementDto> recentMovements = sanitizeMovements(inventoryClient.listMovements()).stream()
                .sorted(Comparator.comparing(InventoryMovementDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(RECENT_MOVEMENTS_LIMIT)
                .toList();
        List<TopUsedItemDto> topUsedItems = sanitizeTopUsed(inventoryClient.topUsedItems(startDate, endDate)).stream()
                .sorted(Comparator.comparing(TopUsedItemDto::getTotalQuantity, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(TOP_USED_LIMIT)
                .toList();
        List<InventorySummaryDto> inventoryReport = sanitizeInventoryReport(inventoryClient.inventoryReport(startDate, endDate));
        List<LowStockAlertDto> alerts = sanitizeAlerts(inventoryClient.lowStockAlerts());
        List<SimpleProviderDto> providers = sanitizeProviders(inventoryClient.providers());
        List<SimpleAreaDto> areas = sanitizeAreas(inventoryClient.areas());
        List<SimpleCategoryDto> categories = sanitizeCategories(inventoryClient.categories());
        List<RoomDto> rooms = sanitizeRooms(roomsClient.listRooms());
        List<RoomConsumptionDto> roomConsumption = sanitizeRoomConsumption(roomsClient.consumptionReport(startDate, endDate)).stream()
                .sorted(Comparator.comparing(RoomConsumptionDto::getTotalQuantity, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(ROOM_CONSUMPTION_LIMIT)
                .toList();
        List<RoomDistributionDto> roomDistribution = sanitizeRoomDistribution(roomsClient.distributionReport(startDate, endDate)).stream()
                .sorted(Comparator.comparing(RoomDistributionDto::getDeliveredAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(ROOM_DISTRIBUTION_LIMIT)
                .toList();
        List<AppUserDto> users = sanitizeUsers(gatewayClient.listUsers());
        String contextSource = contextSource(items, lowStockItems, recentMovements, topUsedItems, inventoryReport, alerts,
                providers, categories, areas, rooms, roomConsumption, roomDistribution, users);

        return new InventorySnapshot(
                items,
                lowStockItems,
                recentMovements,
                topUsedItems,
                inventoryReport,
                alerts,
                providers,
                categories,
                areas,
                rooms,
                roomConsumption,
                roomDistribution,
                users,
                contextSource
        );
    }

    private String buildPrompt(String question, InventorySnapshot snapshot) {
        InventoryMetrics metrics = metrics(snapshot);
        List<RiskRow> prioritized = prioritizedRestock(snapshot.items(), snapshot.inventoryReport());

        String detailedContext;
        try {
            detailedContext = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(snapshot);
        } catch (JsonProcessingException ex) {
            detailedContext = "{\"error\":\"No fue posible serializar el contexto de inventario\"}";
        }

        StringBuilder builder = new StringBuilder();
        builder.append("Pregunta del usuario:\n")
                .append(question.trim())
                .append("\n\n")
                .append("Fuente del contexto: ")
                .append(snapshot.contextSource())
                .append("\n")
                .append("Resumen calculado:\n")
                .append("- Productos totales: ").append(metrics.totalItems()).append('\n')
                .append("- Productos activos: ").append(metrics.activeItems()).append('\n')
                .append("- Productos inactivos: ").append(metrics.inactiveItems()).append('\n')
                .append("- Categorias disponibles: ").append(metrics.totalCategories()).append('\n')
                .append("- Proveedores disponibles: ").append(metrics.totalProviders()).append('\n')
                .append("- Areas del hotel disponibles: ").append(metrics.totalAreas()).append('\n')
                .append("- Habitaciones visibles: ").append(metrics.totalRooms()).append('\n')
                .append("- Habitaciones activas: ").append(metrics.activeRooms()).append('\n')
                .append("- Habitaciones ocupadas: ").append(metrics.occupiedRooms()).append('\n')
                .append("- Habitaciones disponibles: ").append(metrics.availableRooms()).append('\n')
                .append("- Usuarios visibles: ").append(metrics.totalUsers()).append('\n')
                .append("- Usuarios activos: ").append(metrics.activeUsers()).append('\n')
                .append("- Roles visibles: ").append(metrics.totalDistinctRoles()).append('\n')
                .append("- Productos con stock bajo: ").append(metrics.lowStockItems()).append('\n')
                .append("- Productos agotados: ").append(metrics.outOfStockItems()).append('\n')
                .append("- Productos por debajo del minimo: ").append(metrics.belowMinimumItems()).append('\n')
                .append("- Alertas activas: ").append(metrics.openAlerts()).append('\n')
                .append("- Movimientos recientes incluidos: ").append(metrics.recentMovements()).append('\n')
                .append("- Consumo total ultimos 30 dias: ").append(decimal(metrics.totalConsumptionLast30Days())).append('\n')
                .append("- Consumo promedio por producto activo ultimos 30 dias: ").append(decimal(metrics.averageConsumptionPerActiveProduct())).append('\n')
                .append("- Registros de consumo por habitaciones incluidos: ").append(metrics.roomConsumptionRows()).append('\n')
                .append("- Registros de distribucion por habitaciones incluidos: ").append(metrics.roomDistributionRows()).append('\n')
                .append("\n")
                .append("Prioridad sugerida de reabastecimiento:\n");

        if (prioritized.isEmpty()) {
            builder.append("- No hay productos activos con riesgo inmediato segun el contexto recibido.\n");
        } else {
            int position = 1;
            for (RiskRow row : prioritized) {
                builder.append(position++)
                        .append(". ")
                        .append(row.name())
                        .append(" (codigo ").append(row.code()).append(")")
                        .append(" - stock ").append(row.stock())
                        .append(", minimo ").append(row.minStock())
                        .append(", consumo 30 dias ").append(decimal(row.turnoverLast30Days()))
                        .append(", riesgo ").append(row.riskLabel())
                        .append('\n');
            }
        }

        if (!snapshot.topUsedItems().isEmpty()) {
            builder.append("\nTop usados ultimos 30 dias:\n");
            int position = 1;
            for (TopUsedItemDto row : snapshot.topUsedItems()) {
                builder.append(position++)
                        .append(". ")
                        .append(safe(row.getItemName()))
                        .append(" - total ")
                        .append(value(row.getTotalQuantity()))
                        .append('\n');
            }
        }

        if (!snapshot.roomConsumption().isEmpty()) {
            builder.append("\nMayor consumo por habitaciones ultimos 30 dias:\n");
            int position = 1;
            for (RoomConsumptionDto row : snapshot.roomConsumption()) {
                builder.append(position++)
                        .append(". Habitacion ")
                        .append(safe(row.getRoomNumber()))
                        .append(" (").append(safe(row.getRoomType())).append(")")
                        .append(" - ")
                        .append(safe(row.getItemName()))
                        .append(", total ")
                        .append(value(row.getTotalQuantity()))
                        .append('\n');
            }
        }

        if (!snapshot.users().isEmpty()) {
            builder.append("\nResumen de roles visibles:\n");
            for (RoleCountRow row : metrics.roleCounts()) {
                builder.append("- ")
                        .append(row.role())
                        .append(": ")
                        .append(row.total())
                        .append('\n');
            }
        }

        builder.append("\n")
                .append("Contexto detallado en JSON:\n")
                .append(detailedContext)
                .append("\n\n")
                .append("Instrucciones de respuesta:\n")
                .append("- Responde la pregunta con base en el contexto.\n")
                .append("- Si el usuario pide prioridades, ordena de mayor a menor urgencia.\n")
                .append("- Si hablas de consumo promedio, usa el periodo de 30 dias ya calculado.\n")
                .append("- Si algun bloque llega vacio, explica que puede deberse a permisos o falta de datos disponibles.\n")
                .append("- Si aplica, cierra con una recomendacion operativa breve.\n");
        return builder.toString();
    }

    private List<InventoryItemDto> sanitizeItems(List<InventoryItemDto> items) {
        if (items == null) {
            return List.of();
        }
        List<InventoryItemDto> sanitized = new ArrayList<>();
        for (InventoryItemDto item : items) {
            if (item != null) {
                sanitized.add(item);
            }
        }
        return sanitized;
    }

    private List<InventoryMovementDto> sanitizeMovements(List<InventoryMovementDto> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream().filter(Objects::nonNull).toList();
    }

    private List<TopUsedItemDto> sanitizeTopUsed(List<TopUsedItemDto> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream().filter(Objects::nonNull).toList();
    }

    private List<InventorySummaryDto> sanitizeInventoryReport(List<InventorySummaryDto> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream().filter(Objects::nonNull).toList();
    }

    private List<LowStockAlertDto> sanitizeAlerts(List<LowStockAlertDto> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream().filter(Objects::nonNull).toList();
    }

    private List<SimpleProviderDto> sanitizeProviders(List<SimpleProviderDto> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream().filter(Objects::nonNull).toList();
    }

    private List<SimpleAreaDto> sanitizeAreas(List<SimpleAreaDto> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream().filter(Objects::nonNull).toList();
    }

    private List<SimpleCategoryDto> sanitizeCategories(List<SimpleCategoryDto> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream().filter(Objects::nonNull).toList();
    }

    private List<RoomDto> sanitizeRooms(List<RoomDto> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream().filter(Objects::nonNull).toList();
    }

    private List<RoomConsumptionDto> sanitizeRoomConsumption(List<RoomConsumptionDto> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream().filter(Objects::nonNull).toList();
    }

    private List<RoomDistributionDto> sanitizeRoomDistribution(List<RoomDistributionDto> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream().filter(Objects::nonNull).toList();
    }

    private List<AppUserDto> sanitizeUsers(List<AppUserDto> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream().filter(Objects::nonNull).toList();
    }

    private List<InventoryItemDto> detectLowStock(List<InventoryItemDto> items) {
        return items.stream()
                .filter(this::isActive)
                .filter(item -> value(item.getStock()) <= value(item.getMinStock()))
                .toList();
    }

    private InventoryMetrics metrics(InventorySnapshot snapshot) {
        List<InventoryItemDto> items = snapshot.items();
        List<InventoryItemDto> lowStockItems = snapshot.lowStockItems();
        List<LowStockAlertDto> alerts = snapshot.alerts();
        List<SimpleProviderDto> providers = snapshot.providers();
        List<SimpleCategoryDto> categories = snapshot.categories();
        List<SimpleAreaDto> areas = snapshot.areas();
        List<InventoryMovementDto> recentMovements = snapshot.recentMovements();
        List<InventorySummaryDto> inventoryReport = snapshot.inventoryReport();
        List<RoomDto> rooms = snapshot.rooms();
        List<RoomConsumptionDto> roomConsumption = snapshot.roomConsumption();
        List<RoomDistributionDto> roomDistribution = snapshot.roomDistribution();
        List<AppUserDto> users = snapshot.users();

        int activeItems = (int) items.stream().filter(this::isActive).count();
        int outOfStockItems = (int) items.stream().filter(this::isActive).filter(item -> value(item.getStock()) <= 0).count();
        int belowMinimumItems = (int) items.stream().filter(this::isActive).filter(item -> value(item.getStock()) < value(item.getMinStock())).count();
        int openAlerts = (int) alerts.stream().filter(alert -> "ABIERTA".equalsIgnoreCase(safe(alert.getStatus())) || "OPEN".equalsIgnoreCase(safe(alert.getStatus()))).count();
        int activeRooms = (int) rooms.stream().filter(room -> Boolean.TRUE.equals(room.getActive())).count();
        int occupiedRooms = (int) rooms.stream().filter(room -> "OCUPADA".equalsIgnoreCase(safe(room.getStatus()))).count();
        int availableRooms = (int) rooms.stream().filter(room -> "DISPONIBLE".equalsIgnoreCase(safe(room.getStatus()))).count();
        int activeUsers = (int) users.stream().filter(user -> Boolean.TRUE.equals(user.getActive())).count();
        List<RoleCountRow> roleCounts = users.stream()
                .flatMap(user -> safeList(user.getRoles()).stream())
                .map(role -> role == null ? "SIN_ROL" : role.trim().toUpperCase(Locale.ROOT))
                .filter(role -> !role.isBlank())
                .sorted()
                .collect(java.util.stream.Collectors.groupingBy(role -> role, java.util.LinkedHashMap::new, java.util.stream.Collectors.counting()))
                .entrySet()
                .stream()
                .map(entry -> new RoleCountRow(entry.getKey(), entry.getValue().intValue()))
                .toList();
        BigDecimal totalConsumption = inventoryReport.stream()
                .map(InventorySummaryDto::getTurnoverQuantity)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal averageConsumption = activeItems == 0
                ? BigDecimal.ZERO
                : totalConsumption.divide(BigDecimal.valueOf(activeItems), 2, RoundingMode.HALF_UP);

        return new InventoryMetrics(
                items.size(),
                activeItems,
                items.size() - activeItems,
                lowStockItems.size(),
                outOfStockItems,
                belowMinimumItems,
                openAlerts,
                providers.size(),
                categories.size(),
                areas.size(),
                rooms.size(),
                activeRooms,
                occupiedRooms,
                availableRooms,
                users.size(),
                activeUsers,
                roleCounts.size(),
                roleCounts,
                recentMovements.size(),
                roomConsumption.size(),
                roomDistribution.size(),
                totalConsumption,
                averageConsumption
        );
    }

    private List<RiskRow> prioritizedRestock(List<InventoryItemDto> items, List<InventorySummaryDto> inventoryReport) {
        return items.stream()
                .filter(this::isActive)
                .map(item -> new RiskRow(
                        safe(item.getCode()),
                        safe(item.getName()),
                        value(item.getStock()),
                        value(item.getMinStock()),
                        turnoverFor(item.getId(), inventoryReport),
                        riskScore(item, turnoverFor(item.getId(), inventoryReport)),
                        riskLabel(item)
                ))
                .filter(row -> row.riskScore() > 0)
                .sorted(Comparator
                        .comparingInt(RiskRow::riskScore).reversed()
                        .thenComparing(RiskRow::turnoverLast30Days, Comparator.reverseOrder())
                        .thenComparing(RiskRow::name, String.CASE_INSENSITIVE_ORDER))
                .limit(REPLENISHMENT_LIMIT)
                .toList();
    }

    private int riskScore(InventoryItemDto item, BigDecimal turnover) {
        int stock = value(item.getStock());
        int minStock = value(item.getMinStock());
        int score;
        if (stock <= 0) {
            score = 1_000 + Math.max(minStock, 0);
        } else if (minStock <= 0) {
            score = stock <= 2 ? 150 - stock : 0;
        } else if (stock < minStock) {
            score = 500 + (minStock - stock) * 20;
        } else if (stock == minStock) {
            score = 250;
        } else {
            double coverage = stock / (double) minStock;
            score = coverage <= 1.25d ? 120 : 0;
        }
        return score + turnover.multiply(BigDecimal.valueOf(3)).intValue();
    }

    private String riskLabel(InventoryItemDto item) {
        int stock = value(item.getStock());
        int minStock = value(item.getMinStock());
        if (stock <= 0) {
            return "critico";
        }
        if (minStock > 0 && stock < minStock) {
            return "alto";
        }
        if (minStock > 0 && stock == minStock) {
            return "medio";
        }
        return "bajo";
    }

    private BigDecimal turnoverFor(Long itemId, List<InventorySummaryDto> inventoryReport) {
        if (itemId == null) {
            return BigDecimal.ZERO;
        }
        return inventoryReport.stream()
                .filter(row -> itemId.equals(row.getItemId()))
                .findFirst()
                .map(InventorySummaryDto::getTurnoverQuantity)
                .filter(Objects::nonNull)
                .orElse(BigDecimal.ZERO);
    }

    private boolean isActive(InventoryItemDto item) {
        return Boolean.TRUE.equals(item.getActive());
    }

    private int value(Integer value) {
        return Objects.requireNonNullElse(value, 0);
    }

    private long value(Long value) {
        return Objects.requireNonNullElse(value, 0L);
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "SIN_DATO" : value.trim();
    }

    private List<String> safeList(List<String> values) {
        return values == null ? List.of() : values.stream().filter(Objects::nonNull).toList();
    }

    private String decimal(BigDecimal value) {
        return value == null ? "0" : value.stripTrailingZeros().toPlainString();
    }

    private String contextSource(List<InventoryItemDto> items,
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
                                 List<AppUserDto> users) {
        LinkedHashSet<String> sources = new LinkedHashSet<>();
        if (hasAny(items, lowStockItems, recentMovements, topUsedItems, inventoryReport, alerts, providers, categories, areas)) {
            sources.add("inventory-service");
        }
        if (hasAny(rooms, roomConsumption, roomDistribution)) {
            sources.add("rooms-service");
        }
        if (hasAny(users)) {
            sources.add("gateway-service");
        }
        return sources.isEmpty() ? "no-context" : String.join(", ", sources);
    }

    @SafeVarargs
    private boolean hasAny(List<?>... blocks) {
        for (List<?> block : blocks) {
            if (block != null && !block.isEmpty()) {
                return true;
            }
        }
        return false;
    }

    private record InventorySnapshot(
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
            List<AppUserDto> users,
            String contextSource
    ) {
    }

    private record InventoryMetrics(
            int totalItems,
            int activeItems,
            int inactiveItems,
            int lowStockItems,
            int outOfStockItems,
            int belowMinimumItems,
            int openAlerts,
            int totalProviders,
            int totalCategories,
            int totalAreas,
            int totalRooms,
            int activeRooms,
            int occupiedRooms,
            int availableRooms,
            int totalUsers,
            int activeUsers,
            int totalDistinctRoles,
            List<RoleCountRow> roleCounts,
            int recentMovements,
            int roomConsumptionRows,
            int roomDistributionRows,
            BigDecimal totalConsumptionLast30Days,
            BigDecimal averageConsumptionPerActiveProduct
    ) {
    }

    private record RoleCountRow(String role, int total) {
    }

    private record RiskRow(
            String code,
            String name,
            int stock,
            int minStock,
            BigDecimal turnoverLast30Days,
            int riskScore,
            String riskLabel
    ) {
    }
}
