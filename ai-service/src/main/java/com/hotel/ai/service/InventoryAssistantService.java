package com.hotel.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.ai.client.GatewayClient;
import com.hotel.ai.client.InventoryClient;
import com.hotel.ai.client.RoomsClient;
import com.hotel.ai.dto.AppUserDto;
import com.hotel.ai.dto.ConversationDto;
import com.hotel.ai.dto.ConversationMessageDto;
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
import com.hotel.ai.exception.ExternalServiceException;
import com.hotel.ai.dto.SimpleAreaDto;
import com.hotel.ai.dto.SimpleCategoryDto;
import com.hotel.ai.dto.SimpleProviderDto;
import com.hotel.ai.dto.TopUsedItemDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

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
    private static final int RELATED_CONVERSATIONS_PROMPT_LIMIT = 4;
    private static final int RELATED_MESSAGES_PER_CONVERSATION_LIMIT = 3;
    private static final Pattern AVAILABLE_ROOMS_QUESTION = Pattern.compile(
            ".*(habitacion|habitaciones|cuartos?).*(disponib|libre|vacant).*"
                    + "|.*(disponib|libre|cuantas?).*(habitacion|habitaciones|cuartos?).*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern GENERAL_INVENTORY_QUESTION = Pattern.compile(
            ".*(estado general|resumen|panorama|situacion|como esta).*(inventario|stock|hotel).*"
                    + "|.*(inventario|stock).*(general|resumen|estado|actual).*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private final InventoryClient inventoryClient;
    private final RoomsClient roomsClient;
    private final GatewayClient gatewayClient;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;
    private final RoleBasedContextFilter contextFilter;
    private final RoleBasedPromptBuilder promptBuilder;
    private final RoleCapabilitiesService roleCapabilitiesService;

    public InventoryAssistantService(InventoryClient inventoryClient,
                                     RoomsClient roomsClient,
                                     GatewayClient gatewayClient,
                                     GeminiClient geminiClient,
                                     ObjectMapper objectMapper,
                                     RoleBasedContextFilter contextFilter,
                                     RoleBasedPromptBuilder promptBuilder,
                                     RoleCapabilitiesService roleCapabilitiesService) {
        this.inventoryClient = inventoryClient;
        this.roomsClient = roomsClient;
        this.gatewayClient = gatewayClient;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
        this.contextFilter = contextFilter;
        this.promptBuilder = promptBuilder;
        this.roleCapabilitiesService = roleCapabilitiesService;
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

        RoleBasedContextFilter.FilteredContextSnapshot filteredContext =
                filterContextByRole(fullSnapshot, roleContext.role());
        return answerWithContext(
                request.getQuestion(),
                roleContext,
                fullSnapshot,
                filteredContext,
                List.of(),
                List.of()
        );
    }

    public InventoryAssistantResponse answerInventoryQuestion(
            InventoryAssistantRequest request,
            RoleContextInfo roleContext,
            List<ConversationMessageDto> conversationHistory) {
        return answerInventoryQuestion(request, roleContext, conversationHistory, List.of());
    }

    public InventoryAssistantResponse answerInventoryQuestion(
            InventoryAssistantRequest request,
            RoleContextInfo roleContext,
            List<ConversationMessageDto> conversationHistory,
            List<ConversationDto> relatedConversations) {

        InventorySnapshot fullSnapshot = loadContext(request.getInventoryContext());
        RoleBasedContextFilter.FilteredContextSnapshot filteredContext =
                filterContextByRole(fullSnapshot, roleContext.role());
        return answerWithContext(
                request.getQuestion(),
                roleContext,
                fullSnapshot,
                filteredContext,
                conversationHistory,
                relatedConversations
        );
    }

    private InventoryAssistantResponse answerWithContext(
            String question,
            RoleContextInfo roleContext,
            InventorySnapshot fullSnapshot,
            RoleBasedContextFilter.FilteredContextSnapshot filteredContext,
            List<ConversationMessageDto> conversationHistory,
            List<ConversationDto> relatedConversations) {
        InventorySnapshot filteredSnapshot = snapshotFromFiltered(filteredContext);
        Optional<String> directAnswer = tryDirectAnswer(question, filteredSnapshot);
        if (directAnswer.isPresent()) {
            return new InventoryAssistantResponse(directAnswer.get(), fullSnapshot.contextSource());
        }
        try {
            String aiInstructions = promptBuilder.getAiInstructionsForRole(roleContext);
            String prompt = buildPromptWithFilteredContext(
                    question,
                    filteredContext,
                    roleContext,
                    conversationHistory,
                    relatedConversations
            );
            String answer = geminiClient.generateInventoryAnswer(aiInstructions, prompt);
            return new InventoryAssistantResponse(answer, fullSnapshot.contextSource());
        } catch (ExternalServiceException ex) {
            String fallback = tryDirectAnswer(question, filteredSnapshot)
                    .orElseGet(this::friendlyUnavailableMessage);
            return new InventoryAssistantResponse(fallback, fullSnapshot.contextSource());
        }
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
            RoleBasedContextFilter.FilteredContextSnapshot filteredContext,
            RoleContextInfo roleContext) {

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
        return buildPrompt(question, snapshot, roleContext);
    }

    private String buildPromptWithFilteredContext(
            String question,
            RoleBasedContextFilter.FilteredContextSnapshot filteredContext,
            RoleContextInfo roleContext,
            List<ConversationMessageDto> conversationHistory) {
        return buildPromptWithFilteredContext(
                question,
                filteredContext,
                roleContext,
                conversationHistory,
                List.of()
        );
    }

    private String buildPromptWithFilteredContext(
            String question,
            RoleBasedContextFilter.FilteredContextSnapshot filteredContext,
            RoleContextInfo roleContext,
            List<ConversationMessageDto> conversationHistory,
            List<ConversationDto> relatedConversations) {

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

        return buildPrompt(question, snapshot, roleContext, conversationHistory, relatedConversations);
    }

    /**
     * Determina la fuente del contexto para un snapshot filtrado.
     */
    private InventorySnapshot snapshotFromFiltered(RoleBasedContextFilter.FilteredContextSnapshot filteredContext) {
        return new InventorySnapshot(
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
    }

    private Optional<String> tryDirectAnswer(String question, InventorySnapshot snapshot) {
        if (question == null || question.isBlank()) {
            return Optional.empty();
        }
        String normalized = normalizeQuestion(question);
        InventoryMetrics metrics = metrics(snapshot);

        if (AVAILABLE_ROOMS_QUESTION.matcher(normalized).matches()) {
            return Optional.of(answerAvailableRooms(snapshot, metrics));
        }
        if (containsAny(normalized, "stock critico", "critico", "agotad", "reabastec", "bajo stock")) {
            return Optional.of(answerCriticalStock(snapshot, metrics));
        }
        if (containsAny(normalized, "proveedor")) {
            return Optional.of(answerProviders(snapshot));
        }
        if (containsAny(normalized, "categoria", "distribu", "por categoria")) {
            return Optional.of(answerByCategory(snapshot));
        }
        if (containsAny(normalized, "mas usad", "top", "mas utilizad", "mas consum")) {
            return Optional.of(answerTopUsed(snapshot));
        }
        if (containsAny(normalized, "usuario") && containsAny(normalized, "movimiento", "registr", "hoy")) {
            return Optional.of(answerUsersMovementsToday(snapshot));
        }
        if (containsAny(normalized, "movimiento", "reciente", "trazabil")) {
            return Optional.of(answerRecentMovements(snapshot));
        }
        if (containsAny(normalized, "consumo", "promedio") && containsAny(normalized, "habitacion", "tipo")) {
            return Optional.of(answerConsumptionByRoomType(snapshot));
        }
        if (GENERAL_INVENTORY_QUESTION.matcher(normalized).matches()
                || containsAny(normalized, "estado del inventario", "estado inventario")) {
            return Optional.of(answerInventoryStatus(metrics, snapshot));
        }
        return Optional.empty();
    }

    private String answerAvailableRooms(InventorySnapshot snapshot, InventoryMetrics metrics) {
        if (metrics.totalRooms() == 0) {
            return """
                    ## Habitaciones disponibles

                    No hay datos de habitaciones visibles para tu rol en este momento.
                    """.trim();
        }
        List<String> numbers = snapshot.rooms().stream()
                .filter(room -> Boolean.TRUE.equals(room.getActive()))
                .filter(room -> "DISPONIBLE".equalsIgnoreCase(safe(room.getStatus())))
                .map(RoomDto::getNumber)
                .filter(Objects::nonNull)
                .limit(25)
                .toList();
        String list = numbers.isEmpty() ? "sin numeros listados" : String.join(", ", numbers);
        return """
                ## Habitaciones disponibles

                Hay **%d** habitacion(es) disponibles de **%d** registradas (%d activas).

                - Ocupadas: **%d**
                - Disponibles: **%d**

                Numeros: %s
                """.formatted(
                metrics.availableRooms(),
                metrics.totalRooms(),
                metrics.activeRooms(),
                metrics.occupiedRooms(),
                metrics.availableRooms(),
                list).trim();
    }

    private String answerInventoryStatus(InventoryMetrics metrics, InventorySnapshot snapshot) {
        StringBuilder builder = new StringBuilder("""
                ## Estado del inventario

                - Productos registrados: **%d** (activos: **%d**)
                - Stock bajo: **%d** | Agotados: **%d**
                - Alertas abiertas: **%d**
                - Proveedores / categorias / areas: **%d** / **%d** / **%d**
                """.formatted(
                metrics.totalItems(),
                metrics.activeItems(),
                metrics.lowStockItems(),
                metrics.outOfStockItems(),
                metrics.openAlerts(),
                metrics.totalProviders(),
                metrics.totalCategories(),
                metrics.totalAreas()));
        if (metrics.totalRooms() > 0) {
            builder.append("\n- Habitaciones: **")
                    .append(metrics.totalRooms())
                    .append("** total | **")
                    .append(metrics.availableRooms())
                    .append("** disponibles | **")
                    .append(metrics.occupiedRooms())
                    .append("** ocupadas\n");
        }
        if (!snapshot.lowStockItems().isEmpty()) {
            builder.append("\nProductos prioritarios:\n");
            int n = 0;
            for (InventoryItemDto item : snapshot.lowStockItems()) {
                if (n++ >= 5) {
                    break;
                }
                builder.append("- **").append(safe(item.getName())).append("** (stock ")
                        .append(value(item.getStock())).append(", minimo ")
                        .append(value(item.getMinStock())).append(")\n");
            }
        }
        builder.append("\nRevisa **Reposicion** y **Alertas** para acciones inmediatas.");
        return builder.toString().trim();
    }

    private String answerCriticalStock(InventorySnapshot snapshot, InventoryMetrics metrics) {
        if (snapshot.lowStockItems().isEmpty()) {
            return """
                    ## Stock critico

                    No hay productos con stock critico en este momento. Alertas abiertas: **%d**.
                    """.formatted(metrics.openAlerts()).trim();
        }
        StringBuilder builder = new StringBuilder("## Productos con stock critico\n\n");
        int n = 0;
        for (InventoryItemDto item : snapshot.lowStockItems()) {
            if (n++ >= 10) {
                break;
            }
            builder.append("- **").append(safe(item.getName())).append("** — stock ")
                    .append(value(item.getStock())).append(", minimo ")
                    .append(value(item.getMinStock())).append('\n');
        }
        return builder.toString().trim();
    }

    private String answerProviders(InventorySnapshot snapshot) {
        if (snapshot.providers().isEmpty()) {
            return "## Proveedores\n\nNo hay proveedores visibles en tu contexto actual.";
        }
        StringBuilder builder = new StringBuilder("## Proveedores registrados\n\n");
        snapshot.providers().stream().limit(15).forEach(provider ->
                builder.append("- **").append(safe(provider.getName())).append("**")
                        .append(provider.getEmail() != null && !provider.getEmail().isBlank()
                                ? " — " + provider.getEmail()
                                : "")
                        .append('\n'));
        return builder.toString().trim();
    }

    private String answerByCategory(InventorySnapshot snapshot) {
        if (snapshot.items().isEmpty()) {
            return "## Productos por categoria\n\nNo hay productos visibles para agrupar.";
        }
        Map<String, Long> byCategory = snapshot.items().stream()
                .collect(Collectors.groupingBy(
                        item -> {
                            String name = item.getCategory();
                            return name == null || name.isBlank() ? "Sin categoria" : name.trim();
                        },
                        LinkedHashMap::new,
                        Collectors.counting()));
        StringBuilder builder = new StringBuilder("## Distribucion por categoria\n\n");
        byCategory.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .forEach(entry -> builder.append("- **").append(entry.getKey()).append("**: ")
                        .append(entry.getValue()).append(" producto(s)\n"));
        return builder.toString().trim();
    }

    private String answerTopUsed(InventorySnapshot snapshot) {
        if (snapshot.topUsedItems().isEmpty()) {
            return "## Productos mas usados\n\nNo hay datos de consumo en los ultimos 30 dias.";
        }
        StringBuilder builder = new StringBuilder("## Top productos mas usados (30 dias)\n\n");
        int n = 0;
        for (TopUsedItemDto row : snapshot.topUsedItems()) {
            if (n++ >= 10) {
                break;
            }
            builder.append(n).append(". **").append(safe(row.getItemName())).append("** — ")
                    .append(value(row.getTotalQuantity())).append(" unidades\n");
        }
        return builder.toString().trim();
    }

    private String answerRecentMovements(InventorySnapshot snapshot) {
        if (snapshot.recentMovements().isEmpty()) {
            return "## Movimientos recientes\n\nNo hay movimientos recientes visibles para tu rol.";
        }
        StringBuilder builder = new StringBuilder("## Movimientos recientes\n\n");
        int n = 0;
        for (InventoryMovementDto movement : snapshot.recentMovements()) {
            if (n++ >= 10) {
                break;
            }
            builder.append("- ").append(safe(movement.getMovementType()))
                    .append(" · **").append(safe(movement.getItemName())).append("**")
                    .append(" · cantidad ").append(value(movement.getQuantity()))
                    .append('\n');
        }
        return builder.toString().trim();
    }

    private String answerUsersMovementsToday(InventorySnapshot snapshot) {
        if (snapshot.recentMovements().isEmpty()) {
            return "## Movimientos de hoy\n\nNo hay movimientos registrados hoy visibles para tu rol.";
        }
        var today = java.time.LocalDate.now(ZoneId.systemDefault());
        Map<String, Long> byUser = snapshot.recentMovements().stream()
                .filter(movement -> movement.getCreatedAt() != null
                        && movement.getCreatedAt().toLocalDate().isEqual(today))
                .collect(Collectors.groupingBy(
                        movement -> {
                            String name = movement.getResponsible();
                            if (name == null || name.isBlank()) {
                                name = movement.getOperationalResponsible();
                            }
                            return safe(name);
                        },
                        LinkedHashMap::new,
                        Collectors.counting()));
        if (byUser.isEmpty()) {
            return "## Movimientos de hoy\n\nNo hay movimientos de hoy en el historial reciente cargado.";
        }
        StringBuilder builder = new StringBuilder("## Usuarios con movimientos hoy\n\n");
        byUser.forEach((user, count) ->
                builder.append("- **").append(user).append("**: ").append(count).append(" movimiento(s)\n"));
        return builder.toString().trim();
    }

    private String answerConsumptionByRoomType(InventorySnapshot snapshot) {
        if (snapshot.roomConsumption().isEmpty()) {
            return "## Consumo por tipo de habitacion\n\nNo hay registros de consumo en los ultimos 30 dias.";
        }
        Map<String, Long> byType = snapshot.roomConsumption().stream()
                .collect(Collectors.groupingBy(
                        row -> safe(row.getRoomType()),
                        LinkedHashMap::new,
                        Collectors.summingLong(row -> value(row.getTotalQuantity()))));
        StringBuilder builder = new StringBuilder("## Consumo por tipo de habitacion (30 dias)\n\n");
        byType.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .forEach(entry -> builder.append("- **").append(entry.getKey()).append("**: ")
                        .append(entry.getValue()).append(" unidades\n"));
        return builder.toString().trim();
    }

    private String friendlyUnavailableMessage() {
        return """
                No pude analizar esa pregunta en este momento.

                Prueba una de las sugerencias del menu o reformula tu consulta con mas detalle.
                """.trim();
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String normalizeQuestion(String text) {
        return text.toLowerCase(Locale.ROOT)
                .replace('á', 'a').replace('é', 'e').replace('í', 'i')
                .replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')
                .replaceAll("\\s+", " ")
                .trim();
    }

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
        return buildPrompt(question, snapshot, null);
    }

    private String buildPrompt(String question, InventorySnapshot snapshot, RoleContextInfo roleContext) {
        return buildPrompt(question, snapshot, roleContext, List.of());
    }

    private String buildPrompt(String question,
                               InventorySnapshot snapshot,
                               RoleContextInfo roleContext,
                               List<ConversationMessageDto> conversationHistory) {
        return buildPrompt(question, snapshot, roleContext, conversationHistory, List.of());
    }

    private String buildPrompt(String question,
                               InventorySnapshot snapshot,
                               RoleContextInfo roleContext,
                               List<ConversationMessageDto> conversationHistory,
                               List<ConversationDto> relatedConversations) {
        InventoryMetrics metrics = metrics(snapshot);
        List<RiskRow> prioritized = prioritizedRestock(snapshot.items(), snapshot.inventoryReport());

        StringBuilder builder = new StringBuilder();
        builder.append("Pregunta del usuario:\n")
                .append(question.trim())
                .append("\n\n")
                .append(roleContext == null
                        ? ""
                        : roleCapabilitiesService.buildRoleContextBlock(roleContext)
                        + roleCapabilitiesService.buildAccessibleRolesBlock(roleContext) + "\n")
                .append(buildConversationHistoryBlock(conversationHistory))
                .append(buildRelatedConversationsBlock(relatedConversations))
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
                .append("Usa unicamente el resumen calculado y las listas anteriores (sin inventar datos).\n\n")
                .append("━━━ INSTRUCCIONES DE FORMATO (OBLIGATORIO) ━━━\n\n")
                .append("Genera tu respuesta en Markdown limpio y profesional. Sigue estas reglas sin excepción:\n\n")
                .append("ESTRUCTURA:\n")
                .append("- NO uses encabezado H1 (#) al inicio. Empieza directamente con una frase introductoria breve o con H2.\n")
                .append("- Organiza en secciones con ## solo si la respuesta tiene más de 2 temas distintos.\n")
                .append("- Para respuestas cortas (1 tema), usa prosa directa sin secciones.\n\n")
                .append("TEXTO:\n")
                .append("- Usa **negrita** únicamente para cifras clave, nombres de productos o alertas críticas.\n")
                .append("- No abuses de la negrita: máximo 2-3 palabras en negrita por párrafo.\n")
                .append("- Párrafos cortos: máximo 3 oraciones seguidas. Deja línea en blanco entre párrafos.\n")
                .append("- Tono directo, sin frases de relleno como 'Es importante destacar que...'.\n\n")
                .append("LISTAS:\n")
                .append("- Usa listas con guion (-) solo para enumerar 3 o más elementos.\n")
                .append("- Listas numeradas (1. 2. 3.) solo para pasos o prioridades ordenadas.\n")
                .append("- No uses listas para respuestas de 1-2 puntos: úsalas en prosa.\n\n")
                .append("- Nunca simules una lista dentro de un parrafo con '<br>-'. Si hay varios puntos, usa una lista real.\n\n")
                .append("TABLAS:\n")
                .append("- Usa tablas Markdown cuando compares 3 o más elementos con múltiples atributos.\n\n")
                .append("- Si una celda necesita varios puntos, varias lineas o explicaciones, usa una tabla HTML semantica con <table>, <thead>, <tbody>, <tr>, <th>, <td> y listas reales con <ul><li>...</li></ul> dentro de la celda.\n")
                .append("- No metas listas dentro de una tabla Markdown usando '<br>-'.\n")
                .append("- No simules columnas con espacios. Si comparas datos, usa una tabla real.\n\n")
                .append("CIERRE:\n")
                .append("- Termina con una recomendación operativa concreta de 1-2 líneas (sin encabezado).\n")
                .append("- No uses frases genéricas de cierre como 'Espero haber ayudado'.\n\n")
                .append("CONTENIDO:\n")
                .append("- Responde solo con datos del contexto entregado. No inventes datos.\n")
                .append("- Si el usuario pide prioridades, ordena: CRÍTICO → ALTO → MEDIO → BAJO.\n")
                .append("- Si un bloque llega vacío, menciona que no hay datos disponibles para ese punto.\n");
        return builder.toString();
    }

    private String buildConversationHistoryBlock(List<ConversationMessageDto> conversationHistory) {
        if (conversationHistory == null || conversationHistory.isEmpty()) {
            return "";
        }

        StringBuilder builder = new StringBuilder();
        builder.append("Historial reciente de la conversacion:\n");
        conversationHistory.stream()
                .filter(Objects::nonNull)
                .limit(8)
                .forEach(message -> builder.append("- [")
                        .append(message.createdAt())
                        .append("] Pregunta: ")
                        .append(safe(message.question()))
                        .append('\n')
                        .append("  Respuesta: ")
                        .append(safe(message.answer()))
                        .append('\n'));
        builder.append("- Si el usuario menciona preguntas anteriores, usa este historial para mantener continuidad.\n\n");
        return builder.toString();
    }

    private String buildRelatedConversationsBlock(List<ConversationDto> relatedConversations) {
        if (relatedConversations == null || relatedConversations.isEmpty()) {
            return "";
        }

        StringBuilder builder = new StringBuilder();
        builder.append("Otras conversaciones recientes del mismo usuario:\n");
        relatedConversations.stream()
                .filter(Objects::nonNull)
                .limit(RELATED_CONVERSATIONS_PROMPT_LIMIT)
                .forEach(conversation -> {
                    builder.append("- Conversacion #")
                            .append(conversation.id())
                            .append(" | titulo: ")
                            .append(safe(conversation.title()))
                            .append(" | actualizada: ")
                            .append(conversation.updatedAt())
                            .append('\n');

                    conversation.messages().stream()
                            .filter(Objects::nonNull)
                            .limit(RELATED_MESSAGES_PER_CONVERSATION_LIMIT)
                            .forEach(message -> builder.append("  * Pregunta: ")
                                    .append(safe(message.question()))
                                    .append('\n')
                                    .append("    Respuesta: ")
                                    .append(safe(message.answer()))
                                    .append('\n'));
                });
        builder.append("- Usa estas conversaciones como memoria de preferencias, temas previos y continuidad del usuario.\n")
                .append("- Si hay conflicto entre esas conversaciones y la conversacion actual, prioriza la conversacion actual y el contexto mas reciente.\n\n");
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
