package com.hotel.inventory.controller;

import com.hotel.inventory.dto.CreateSupplyItemRequest;
import com.hotel.inventory.dto.InternalStockDecreaseRequest;
import com.hotel.inventory.dto.StockChangeResponse;
import com.hotel.inventory.dto.StockEntryRequest;
import com.hotel.inventory.dto.StockReturnRequest;
import com.hotel.inventory.dto.InventorySummaryReport;
import com.hotel.inventory.dto.TopUsedItemReport;
import com.hotel.inventory.dto.UpdateSupplyItemRequest;
import com.hotel.inventory.dto.VoidMovementRequest;
import com.hotel.inventory.exception.BusinessException;
import com.hotel.inventory.model.InventoryMovement;
import com.hotel.inventory.model.LowStockAlert;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.service.AuditService;
import com.hotel.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryService inventoryService;
    private final AuditService auditService;

    public InventoryController(InventoryService inventoryService, AuditService auditService) {
        this.inventoryService = inventoryService;
        this.auditService = auditService;
    }

    @PostMapping("/items")
    public SupplyItem createItem(@Valid @RequestBody CreateSupplyItemRequest request, Authentication authentication) {
        return inventoryService.createItem(request, username(authentication));
    }

    @GetMapping("/items")
    public List<SupplyItem> listItems(@RequestParam(required = false) String category, Authentication authentication) {
        auditService.record("QUERY_ITEMS", "SupplyItem", null, username(authentication), category == null ? "Listado general" : "Categoria " + category);
        if (category != null && !category.isBlank()) {
            if (!hasAnyRole(authentication, "ADMIN", "ALMACENISTA")) {
                throw new AccessDeniedException("La consulta por categoria esta restringida a administrador y almacenista");
            }
            return inventoryService.listItemsByCategory(category);
        }
        return inventoryService.listItems();
    }

    @GetMapping("/items/{id}")
    public SupplyItem getItem(@PathVariable Long id) {
        return inventoryService.getItem(id);
    }

    @PutMapping("/items/{id}")
    public SupplyItem updateItem(@PathVariable Long id, @Valid @RequestBody UpdateSupplyItemRequest request, Authentication authentication) {
        return inventoryService.updateItem(id, request, username(authentication));
    }

    @PatchMapping("/items/{id}/deactivate")
    public SupplyItem deactivateItem(@PathVariable Long id, Authentication authentication) {
        return inventoryService.deactivateItem(id, username(authentication));
    }

    @PostMapping("/items/{id}/entries")
    public SupplyItem addEntry(@PathVariable Long id, @Valid @RequestBody StockEntryRequest request, Authentication authentication) {
        return inventoryService.addStock(id, request, username(authentication));
    }

    @PostMapping("/items/{id}/returns")
    public StockChangeResponse returnStock(@PathVariable Long id, @Valid @RequestBody StockReturnRequest request, Authentication authentication) {
        return inventoryService.returnStock(id, request, username(authentication));
    }

    @PostMapping("/internal/items/decrease")
    public StockChangeResponse decreaseStock(@Valid @RequestBody InternalStockDecreaseRequest request,
                                             @RequestHeader(name = "X-Rooms-Service-Flow", defaultValue = "false") boolean roomsServiceFlow,
                                             Authentication authentication) {
        if (!roomsServiceFlow && !hasAnyRole(authentication, "ADMIN", "ALMACENISTA")) {
            throw new AccessDeniedException("Las salidas directas de inventario estan restringidas a administrador y almacenista");
        }
        return inventoryService.decreaseStock(request, username(authentication), roomsServiceFlow);
    }

    @GetMapping("/movements")
    public List<InventoryMovement> listMovements(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String origin,
            @RequestParam(required = false) String roomNumber,
            @RequestParam(required = false) String responsible,
            @RequestParam(required = false) String operationalResponsible,
            @RequestParam(required = false) String areaName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) {
        validateDateRange(startDate, endDate);
        auditService.record("QUERY_MOVEMENTS", "InventoryMovement", null, username(authentication), "Consulta de movimientos");
        return inventoryService.listMovements(type, origin, roomNumber, responsible, operationalResponsible, areaName, startDate, endDate);
    }

    @GetMapping("/items/low-stock")
    public List<SupplyItem> lowStockItems(Authentication authentication) {
        auditService.record("QUERY_LOW_STOCK", "SupplyItem", null, username(authentication), "Consulta de stock bajo");
        return inventoryService.lowStockItems();
    }

    @GetMapping("/alerts/low-stock")
    public List<LowStockAlert> lowStockAlerts(@RequestParam(defaultValue = "true") Boolean openOnly, Authentication authentication) {
        auditService.record("QUERY_LOW_STOCK_ALERTS", "LowStockAlert", null, username(authentication), "openOnly=" + openOnly);
        return inventoryService.lowStockAlerts(openOnly);
    }

    @PostMapping("/movements/{id}/void")
    public InventoryMovement voidMovement(@PathVariable Long id, @Valid @RequestBody VoidMovementRequest request,
                                          Authentication authentication) {
        return inventoryService.voidMovement(id, request, username(authentication));
    }

    @GetMapping("/reports/inventory")
    public List<InventorySummaryReport> inventoryReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) {
        validateDateRange(startDate, endDate);
        auditService.record("GENERATE_INVENTORY_REPORT", "InventorySummaryReport", null, username(authentication), "Reporte inventario");
        return inventoryService.inventoryReport(startDate, endDate);
    }

    @GetMapping("/reports/top-used")
    public List<TopUsedItemReport> topUsedItems(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) {
        validateDateRange(startDate, endDate);
        auditService.record("GENERATE_TOP_USED_REPORT", "TopUsedItemReport", null, username(authentication), "Reporte insumos mas usados");
        return inventoryService.topUsedItems(startDate, endDate);
    }

    @GetMapping("/reports/inventory/export")
    public ResponseEntity<byte[]> exportInventoryReport(
            @RequestParam(defaultValue = "xlsx") String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) throws IOException {
        validateDateRange(startDate, endDate);
        String normalizedFormat = normalizeFormat(format);
        auditService.record("EXPORT_INVENTORY_REPORT", "InventorySummaryReport", null, username(authentication), "format=" + normalizedFormat);
        List<InventorySummaryReport> rows = inventoryService.inventoryReport(startDate, endDate);
        if ("pdf".equals(normalizedFormat)) {
            return download("inventory-report.pdf", MediaType.APPLICATION_PDF, inventoryPdf(rows));
        }
        if ("csv".equals(normalizedFormat)) {
            return download("inventory-report.csv", new MediaType("text", "csv", StandardCharsets.UTF_8), inventoryCsv(rows));
        }
        return download("inventory-report.xlsx", MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), inventoryXlsx(rows));
    }

    @GetMapping("/reports/top-used/export")
    public ResponseEntity<byte[]> exportTopUsedReport(
            @RequestParam(defaultValue = "xlsx") String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) throws IOException {
        validateDateRange(startDate, endDate);
        String normalizedFormat = normalizeFormat(format);
        auditService.record("EXPORT_TOP_USED_REPORT", "TopUsedItemReport", null, username(authentication), "format=" + normalizedFormat);
        List<TopUsedItemReport> rows = inventoryService.topUsedItems(startDate, endDate);
        if ("pdf".equals(normalizedFormat)) {
            return download("top-used-report.pdf", MediaType.APPLICATION_PDF, topUsedPdf(rows));
        }
        if ("csv".equals(normalizedFormat)) {
            return download("top-used-report.csv", new MediaType("text", "csv", StandardCharsets.UTF_8), topUsedCsv(rows));
        }
        return download("top-used-report.xlsx", MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), topUsedXlsx(rows));
    }

    private String username(Authentication authentication) {
        return authentication == null ? "sistema" : authentication.getName();
    }

    private boolean hasAnyRole(Authentication authentication, String... roles) {
        if (authentication == null) {
            return false;
        }
        List<String> expected = java.util.Arrays.stream(roles).map(role -> "ROLE_" + role).toList();
        return authentication.getAuthorities().stream().anyMatch(authority -> expected.contains(authority.getAuthority()));
    }

    private ResponseEntity<byte[]> download(String filename, MediaType mediaType, byte[] body) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(mediaType)
                .body(body);
    }

    private String normalizeFormat(String format) {
        String normalized = format == null || format.isBlank() ? "xlsx" : format.trim().toLowerCase(java.util.Locale.ROOT);
        if (!List.of("xlsx", "csv", "pdf").contains(normalized)) {
            throw new BusinessException("Formato de exportacion no soportado: " + format);
        }
        return normalized;
    }

    private byte[] inventoryCsv(List<InventorySummaryReport> rows) {
        StringBuilder csv = new StringBuilder("itemId,code,name,category,unit,currentStock,minStock,maxStock,lowStock,turnoverQuantity\n");
        rows.forEach(row -> csv.append(csv(row.itemId())).append(',').append(csv(row.code())).append(',').append(csv(row.name())).append(',')
                .append(csv(row.category())).append(',').append(csv(row.unit())).append(',').append(csv(row.currentStock())).append(',')
                .append(csv(row.minStock())).append(',').append(csv(row.maxStock())).append(',').append(csv(row.lowStock())).append(',')
                .append(csv(row.turnoverQuantity())).append('\n'));
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] inventoryXlsx(List<InventorySummaryReport> rows) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Inventario");
            Row header = sheet.createRow(0);
            String[] headers = {"itemId", "code", "name", "category", "unit", "currentStock", "minStock", "maxStock", "lowStock", "turnoverQuantity"};
            for (int i = 0; i < headers.length; i++) header.createCell(i).setCellValue(headers[i]);
            for (int i = 0; i < rows.size(); i++) {
                InventorySummaryReport row = rows.get(i);
                Row excelRow = sheet.createRow(i + 1);
                excelRow.createCell(0).setCellValue(row.itemId());
                excelRow.createCell(1).setCellValue(row.code());
                excelRow.createCell(2).setCellValue(row.name());
                excelRow.createCell(3).setCellValue(row.category());
                excelRow.createCell(4).setCellValue(row.unit());
                excelRow.createCell(5).setCellValue(row.currentStock());
                excelRow.createCell(6).setCellValue(row.minStock());
                if (row.maxStock() != null) {
                    excelRow.createCell(7).setCellValue(row.maxStock());
                } else {
                    excelRow.createCell(7).setBlank();
                }
                excelRow.createCell(8).setCellValue(row.lowStock());
                excelRow.createCell(9).setCellValue(row.turnoverQuantity().doubleValue());
            }
            workbook.write(output);
            return output.toByteArray();
        }
    }

    private byte[] inventoryPdf(List<InventorySummaryReport> rows) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            writePdfLines(document, "Reporte general de inventario", rows.stream()
                    .map(row -> row.code() + " - " + row.name() + " | stock: " + row.currentStock() + " | bajo: " + row.lowStock())
                    .toList());
            document.save(output);
            return output.toByteArray();
        }
    }

    private byte[] topUsedCsv(List<TopUsedItemReport> rows) {
        StringBuilder csv = new StringBuilder("itemId,itemName,totalQuantity\n");
        rows.forEach(row -> csv.append(csv(row.itemId())).append(',').append(csv(row.itemName())).append(',').append(csv(row.totalQuantity())).append('\n'));
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String csv(Object value) {
        if (value == null) {
            return "";
        }
        String text = String.valueOf(value);
        if (text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }

    private byte[] topUsedXlsx(List<TopUsedItemReport> rows) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Mas usados");
            Row header = sheet.createRow(0);
            String[] headers = {"itemId", "itemName", "totalQuantity"};
            for (int i = 0; i < headers.length; i++) header.createCell(i).setCellValue(headers[i]);
            for (int i = 0; i < rows.size(); i++) {
                TopUsedItemReport row = rows.get(i);
                Row excelRow = sheet.createRow(i + 1);
                excelRow.createCell(0).setCellValue(row.itemId());
                excelRow.createCell(1).setCellValue(row.itemName());
                excelRow.createCell(2).setCellValue(row.totalQuantity());
            }
            workbook.write(output);
            return output.toByteArray();
        }
    }

    private byte[] topUsedPdf(List<TopUsedItemReport> rows) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            writePdfLines(document, "Reporte de insumos mas utilizados", rows.stream()
                    .map(row -> row.itemName() + " | total: " + row.totalQuantity())
                    .toList());
            document.save(output);
            return output.toByteArray();
        }
    }

    private void writePdfLines(PDDocument document, String title, List<String> lines) throws IOException {
        PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        int index = 0;
        boolean firstPage = true;
        while (index < lines.size() || firstPage) {
            firstPage = false;
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                content.setFont(font, 10);
                content.beginText();
                content.newLineAtOffset(40, 750);
                content.showText(index == 0 ? title : title + " (continuacion)");
                content.newLineAtOffset(0, -18);
                int lineCount = 0;
                while (index < lines.size() && lineCount < 48) {
                    content.showText(lines.get(index));
                    content.newLineAtOffset(0, -14);
                    index++;
                    lineCount++;
                }
                content.endText();
            }
        }
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new BusinessException("La fecha final no puede ser anterior a la fecha inicial");
        }
    }
}
