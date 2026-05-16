package com.hotel.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.ai.client.InventoryClient;
import com.hotel.ai.dto.InventoryAssistantRequest;
import com.hotel.ai.dto.InventoryAssistantResponse;
import com.hotel.ai.dto.InventoryContextDto;
import com.hotel.ai.dto.InventoryItemDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class InventoryAssistantService {
    private static final String AI_INSTRUCTIONS = """
            Eres un asistente de inventario para un hotel.
            Responde siempre en espanol claro y accionable.
            Usa solo el contexto entregado en la solicitud.
            Si los datos no alcanzan para afirmar algo con certeza, dilo explicitamente.
            No inventes stock, movimientos ni productos que no aparecen en el contexto.
            Prioriza recomendaciones practicas sobre reabastecimiento, riesgo de agotamiento y resumen operativo.
            """;

    private final InventoryClient inventoryClient;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public InventoryAssistantService(InventoryClient inventoryClient, GeminiClient geminiClient, ObjectMapper objectMapper) {
        this.inventoryClient = inventoryClient;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    public InventoryAssistantResponse answerInventoryQuestion(InventoryAssistantRequest request) {
        InventorySnapshot snapshot = loadContext(request.getInventoryContext());
        String prompt = buildPrompt(request.getQuestion(), snapshot);
        String answer = geminiClient.generateInventoryAnswer(AI_INSTRUCTIONS, prompt);
        return new InventoryAssistantResponse(answer, snapshot.contextSource());
    }

    private InventorySnapshot loadContext(InventoryContextDto requestContext) {
        if (requestContext != null && requestContext.getItems() != null && !requestContext.getItems().isEmpty()) {
            List<InventoryItemDto> items = sanitizeItems(requestContext.getItems());
            return new InventorySnapshot(items, detectLowStock(items), "request");
        }

        List<InventoryItemDto> items = sanitizeItems(inventoryClient.listItems());
        List<InventoryItemDto> lowStockItems = sanitizeItems(inventoryClient.lowStockItems());
        return new InventorySnapshot(items, lowStockItems, "inventory-service");
    }

    private String buildPrompt(String question, InventorySnapshot snapshot) {
        InventoryMetrics metrics = metrics(snapshot.items(), snapshot.lowStockItems());
        List<RiskRow> prioritized = prioritizedRestock(snapshot.items());

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
                .append("- Productos con stock bajo: ").append(metrics.lowStockItems()).append('\n')
                .append("- Productos agotados: ").append(metrics.outOfStockItems()).append('\n')
                .append("- Productos por debajo del minimo: ").append(metrics.belowMinimumItems()).append('\n')
                .append("- Productos con stock exactamente en minimo: ").append(metrics.atMinimumItems()).append('\n')
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
                        .append(", riesgo ").append(row.riskLabel())
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
                .append("- Si faltan datos historicos para medir consumo real, aclara que la recomendacion se basa en stock actual, minimo configurado y productos agotados.\n")
                .append("- Si aplica, cierra con una recomendacion operativa breve.\n");
        return builder.toString();
    }

    private List<InventoryItemDto> sanitizeItems(List<InventoryItemDto> items) {
        if (items == null) {
            return List.of();
        }
        List<InventoryItemDto> sanitized = new ArrayList<>();
        for (InventoryItemDto item : items) {
            if (item == null) {
                continue;
            }
            sanitized.add(item);
        }
        return sanitized;
    }

    private List<InventoryItemDto> detectLowStock(List<InventoryItemDto> items) {
        return items.stream()
                .filter(this::isActive)
                .filter(item -> value(item.getStock()) <= value(item.getMinStock()))
                .toList();
    }

    private InventoryMetrics metrics(List<InventoryItemDto> items, List<InventoryItemDto> lowStockItems) {
        int activeItems = (int) items.stream().filter(this::isActive).count();
        int outOfStockItems = (int) items.stream().filter(this::isActive).filter(item -> value(item.getStock()) <= 0).count();
        int belowMinimumItems = (int) items.stream().filter(this::isActive).filter(item -> value(item.getStock()) < value(item.getMinStock())).count();
        int atMinimumItems = (int) items.stream().filter(this::isActive).filter(item -> value(item.getStock()) == value(item.getMinStock())).count();
        return new InventoryMetrics(
                items.size(),
                activeItems,
                items.size() - activeItems,
                lowStockItems.size(),
                outOfStockItems,
                belowMinimumItems,
                atMinimumItems
        );
    }

    private List<RiskRow> prioritizedRestock(List<InventoryItemDto> items) {
        return items.stream()
                .filter(this::isActive)
                .map(item -> new RiskRow(
                        safe(item.getCode()),
                        safe(item.getName()),
                        value(item.getStock()),
                        value(item.getMinStock()),
                        riskScore(item),
                        riskLabel(item)
                ))
                .filter(row -> row.riskScore() > 0)
                .sorted(Comparator
                        .comparingInt(RiskRow::riskScore).reversed()
                        .thenComparing(RiskRow::name, String.CASE_INSENSITIVE_ORDER))
                .limit(5)
                .toList();
    }

    private int riskScore(InventoryItemDto item) {
        int stock = value(item.getStock());
        int minStock = value(item.getMinStock());
        if (stock <= 0) {
            return 1_000 + Math.max(minStock, 0);
        }
        if (minStock <= 0) {
            return stock <= 2 ? 150 - stock : 0;
        }
        if (stock < minStock) {
            return 500 + (minStock - stock) * 20;
        }
        if (stock == minStock) {
            return 250;
        }
        double coverage = stock / (double) minStock;
        if (coverage <= 1.25d) {
            return 120;
        }
        return 0;
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

    private boolean isActive(InventoryItemDto item) {
        return Boolean.TRUE.equals(item.getActive());
    }

    private int value(Integer value) {
        return Objects.requireNonNullElse(value, 0);
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "SIN_DATO" : value.trim();
    }

    private record InventorySnapshot(List<InventoryItemDto> items, List<InventoryItemDto> lowStockItems, String contextSource) {
    }

    private record InventoryMetrics(
            int totalItems,
            int activeItems,
            int inactiveItems,
            int lowStockItems,
            int outOfStockItems,
            int belowMinimumItems,
            int atMinimumItems
    ) {
    }

    private record RiskRow(String code, String name, int stock, int minStock, int riskScore, String riskLabel) {
    }
}
