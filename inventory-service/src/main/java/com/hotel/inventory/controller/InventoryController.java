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
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
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
import java.awt.Color;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Color EXPORT_GOLD = new Color(200, 146, 45);
    private static final Color EXPORT_GOLD_LIGHT = new Color(230, 189, 106);
    private static final Color EXPORT_BROWN = new Color(61, 43, 31);
    private static final Color EXPORT_MUTED = new Color(138, 115, 92);
    private static final Color EXPORT_CREAM = new Color(253, 251, 247);
    private static final Color EXPORT_IVORY = new Color(245, 237, 225);
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
            return download("inventory-report.pdf", MediaType.APPLICATION_PDF, inventoryPdf(rows, startDate, endDate));
        }
        if ("csv".equals(normalizedFormat)) {
            return download("inventory-report.csv", new MediaType("text", "csv", StandardCharsets.UTF_8), inventoryCsv(rows, startDate, endDate));
        }
        return download("inventory-report.xlsx", MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), inventoryXlsx(rows, startDate, endDate));
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
            return download("top-used-report.pdf", MediaType.APPLICATION_PDF, topUsedPdf(rows, startDate, endDate));
        }
        if ("csv".equals(normalizedFormat)) {
            return download("top-used-report.csv", new MediaType("text", "csv", StandardCharsets.UTF_8), topUsedCsv(rows, startDate, endDate));
        }
        return download("top-used-report.xlsx", MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), topUsedXlsx(rows, startDate, endDate));
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

    private byte[] inventoryCsv(List<InventorySummaryReport> rows, LocalDate startDate, LocalDate endDate) {
        StringBuilder csv = csvMetadata("Reporte general de inventario", startDate, endDate, rows.size());
        csv.append("Codigo,Nombre,Categoria,Unidad,Stock actual,Stock minimo,Stock maximo,Stock bajo,Rotacion\n");
        rows.forEach(row -> csv.append(csv(row.code())).append(',').append(csv(row.name())).append(',')
                .append(csv(row.category())).append(',').append(csv(row.unit())).append(',').append(csv(row.currentStock())).append(',')
                .append(csv(row.minStock())).append(',').append(csv(row.maxStock())).append(',').append(csv(row.lowStock() ? "Si" : "No")).append(',')
                .append(csv(decimal(row.turnoverQuantity()))).append('\n'));
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] inventoryXlsx(List<InventorySummaryReport> rows, LocalDate startDate, LocalDate endDate) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Inventario");
            writeWorkbookReport(
                    workbook,
                    sheet,
                    "Reporte general de inventario",
                    startDate,
                    endDate,
                    rows.size(),
                    List.of("Codigo", "Nombre", "Categoria", "Unidad", "Stock actual", "Stock minimo", "Stock maximo", "Stock bajo", "Rotacion"),
                    rows,
                    List.of(
                            InventorySummaryReport::code,
                            InventorySummaryReport::name,
                            InventorySummaryReport::category,
                            InventorySummaryReport::unit,
                            row -> row.currentStock(),
                            row -> row.minStock(),
                            InventorySummaryReport::maxStock,
                            row -> row.lowStock() ? "Si" : "No",
                            row -> decimal(row.turnoverQuantity())
                    )
            );
            workbook.write(output);
            return output.toByteArray();
        }
    }

    private byte[] inventoryPdf(List<InventorySummaryReport> rows, LocalDate startDate, LocalDate endDate) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            writePdfTable(
                    document,
                    "Reporte general de inventario",
                    reportMetadata(startDate, endDate, rows.size()),
                    List.of("Codigo", "Nombre", "Categoria", "Stock", "Min", "Max", "Bajo", "Rotacion"),
                    List.of(60f, 160f, 100f, 45f, 40f, 40f, 40f, 55f),
                    rows.stream()
                            .map(row -> List.of(
                                    safe(row.code()),
                                    safe(row.name()),
                                    safe(row.category()),
                                    safe(row.currentStock()),
                                    safe(row.minStock()),
                                    safe(row.maxStock()),
                                    row.lowStock() ? "Si" : "No",
                                    decimal(row.turnoverQuantity())
                            ))
                            .toList()
            );
            document.save(output);
            return output.toByteArray();
        }
    }

    private byte[] topUsedCsv(List<TopUsedItemReport> rows, LocalDate startDate, LocalDate endDate) {
        StringBuilder csv = csvMetadata("Reporte de insumos mas utilizados", startDate, endDate, rows.size());
        csv.append("Insumo,Cantidad total\n");
        rows.forEach(row -> csv.append(csv(row.itemName())).append(',').append(csv(row.totalQuantity())).append('\n'));
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

    private byte[] topUsedXlsx(List<TopUsedItemReport> rows, LocalDate startDate, LocalDate endDate) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Mas usados");
            writeWorkbookReport(
                    workbook,
                    sheet,
                    "Reporte de insumos mas utilizados",
                    startDate,
                    endDate,
                    rows.size(),
                    List.of("Insumo", "Cantidad total"),
                    rows,
                    List.of(
                            TopUsedItemReport::itemName,
                            TopUsedItemReport::totalQuantity
                    )
            );
            workbook.write(output);
            return output.toByteArray();
        }
    }

    private byte[] topUsedPdf(List<TopUsedItemReport> rows, LocalDate startDate, LocalDate endDate) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            writePdfTable(
                    document,
                    "Reporte de insumos mas utilizados",
                    reportMetadata(startDate, endDate, rows.size()),
                    List.of("Insumo", "Cantidad total"),
                    List.of(420f, 120f),
                    rows.stream()
                            .map(row -> List.of(safe(row.itemName()), safe(row.totalQuantity())))
                            .toList()
            );
            document.save(output);
            return output.toByteArray();
        }
    }

    private <T> void writeWorkbookReport(
            XSSFWorkbook workbook,
            Sheet sheet,
            String title,
            LocalDate startDate,
            LocalDate endDate,
            int totalRows,
            List<String> headers,
            List<T> rows,
            List<Function<T, Object>> extractors
    ) {
        XSSFCellStyle titleStyle = workbook.createCellStyle();
        XSSFFont titleFont = workbook.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 14);
        titleFont.setColor(new XSSFColor(EXPORT_BROWN, null));
        titleStyle.setFont(titleFont);
        titleStyle.setFillForegroundColor(new XSSFColor(EXPORT_CREAM, null));
        titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        XSSFCellStyle metadataStyle = workbook.createCellStyle();
        XSSFFont metadataFont = workbook.createFont();
        metadataFont.setItalic(true);
        metadataFont.setColor(new XSSFColor(EXPORT_MUTED, null));
        metadataStyle.setFont(metadataFont);
        metadataStyle.setFillForegroundColor(new XSSFColor(EXPORT_IVORY, null));
        metadataStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        XSSFCellStyle headerStyle = workbook.createCellStyle();
        XSSFFont headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(new XSSFColor(EXPORT_BROWN, null));
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(new XSSFColor(EXPORT_GOLD_LIGHT, null));
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);
        headerStyle.setBorderBottom(BorderStyle.THIN);
        headerStyle.setBottomBorderColor(new XSSFColor(EXPORT_GOLD, null));

        XSSFCellStyle bodyStyle = workbook.createCellStyle();
        bodyStyle.setFillForegroundColor(new XSSFColor(Color.WHITE, null));
        bodyStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        XSSFCellStyle alternateBodyStyle = workbook.createCellStyle();
        alternateBodyStyle.setFillForegroundColor(new XSSFColor(EXPORT_CREAM, null));
        alternateBodyStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        int rowIndex = 0;
        Row titleRow = sheet.createRow(rowIndex++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(title);
        titleCell.setCellStyle(titleStyle);

        for (String metadata : reportMetadata(startDate, endDate, totalRows)) {
            Row metadataRow = sheet.createRow(rowIndex++);
            Cell metadataCell = metadataRow.createCell(0);
            metadataCell.setCellValue(metadata);
            metadataCell.setCellStyle(metadataStyle);
        }

        rowIndex++;
        Row headerRow = sheet.createRow(rowIndex++);
        for (int i = 0; i < headers.size(); i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers.get(i));
            cell.setCellStyle(headerStyle);
        }

        int dataIndex = 0;
        for (T row : rows) {
            Row dataRow = sheet.createRow(rowIndex++);
            CellStyle rowStyle = dataIndex++ % 2 == 0 ? bodyStyle : alternateBodyStyle;
            for (int i = 0; i < extractors.size(); i++) {
                Cell cell = dataRow.createCell(i);
                writeCell(cell, extractors.get(i).apply(row), rowStyle);
            }
        }

        sheet.createFreezePane(0, headerRow.getRowNum() + 1);
        sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(headerRow.getRowNum(), headerRow.getRowNum(), 0, headers.size() - 1));
        for (int i = 0; i < headers.size(); i++) {
            sheet.autoSizeColumn(i);
            sheet.setColumnWidth(i, Math.min(sheet.getColumnWidth(i) + 1200, 18000));
        }
    }

    private void writeCell(Cell cell, Object value) {
        writeCell(cell, value, null);
    }

    private void writeCell(Cell cell, Object value, CellStyle style) {
        if (style != null) {
            cell.setCellStyle(style);
        }
        if (value == null) {
            cell.setBlank();
            return;
        }
        if (value instanceof Number number) {
            cell.setCellValue(number.doubleValue());
            return;
        }
        cell.setCellValue(String.valueOf(value));
    }

    private void writePdfTable(
            PDDocument document,
            String title,
            List<String> metadataLines,
            List<String> headers,
            List<Float> columnWidths,
            List<List<String>> rows
    ) throws IOException {
        PDType1Font titleFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDType1Font bodyFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        PDType1Font headerFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDRectangle pageSize = new PDRectangle(PDRectangle.LETTER.getHeight(), PDRectangle.LETTER.getWidth());
        float margin = 36f;
        float rowHeight = 18f;
        float tableWidth = columnWidths.stream().reduce(0f, Float::sum);
        int rowIndex = 0;
        boolean firstPage = true;

        while (rowIndex < rows.size() || firstPage) {
            firstPage = false;
            PDPage page = new PDPage(pageSize);
            document.addPage(page);
            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                float y = pageSize.getHeight() - margin;
                y = writeText(content, title, titleFont, 14, margin, y);
                for (String metadata : metadataLines) {
                    y = writeText(content, metadata, bodyFont, 9, margin, y - 4);
                }
                y -= 14;
                drawTableRow(content, y, margin, rowHeight, tableWidth, columnWidths, headers, headerFont, 9, true, false);
                y -= rowHeight;

                while (rowIndex < rows.size() && y > margin + rowHeight) {
                    drawTableRow(content, y, margin, rowHeight, tableWidth, columnWidths, rows.get(rowIndex), bodyFont, 8.5f, false, rowIndex % 2 == 1);
                    y -= rowHeight;
                    rowIndex++;
                }
            }
        }
    }

    private float writeText(PDPageContentStream content, String text, PDType1Font font, float fontSize, float x, float y) throws IOException {
        content.beginText();
        content.setFont(font, fontSize);
        content.newLineAtOffset(x, y);
        content.showText(pdfText(font, truncate(text, 110)));
        content.endText();
        return y - (fontSize + 2);
    }

    private void drawTableRow(
            PDPageContentStream content,
            float y,
            float startX,
            float rowHeight,
            float tableWidth,
        List<Float> columnWidths,
        List<String> values,
        PDType1Font font,
        float fontSize,
        boolean header,
        boolean alternate
    ) throws IOException {
        if (header) {
            setFillColor(content, EXPORT_GOLD_LIGHT);
            content.addRect(startX, y - rowHeight, tableWidth, rowHeight);
            content.fill();
        } else if (alternate) {
            setFillColor(content, EXPORT_CREAM);
            content.addRect(startX, y - rowHeight, tableWidth, rowHeight);
            content.fill();
        }

        float x = startX;
        setStrokeColor(content, EXPORT_GOLD_LIGHT);
        for (int i = 0; i < columnWidths.size(); i++) {
            float width = columnWidths.get(i);
            content.addRect(x, y - rowHeight, width, rowHeight);
            content.stroke();

            content.beginText();
            setFillColor(content, header ? EXPORT_BROWN : EXPORT_BROWN);
            content.setFont(font, fontSize);
            content.newLineAtOffset(x + 3, y - 12);
            content.showText(pdfText(font, truncate(values.get(i), widthToChars(width))));
            content.endText();
            x += width;
        }
        setFillColor(content, Color.BLACK);
    }

    private void setFillColor(PDPageContentStream content, Color color) throws IOException {
        content.setNonStrokingColor(
                color.getRed() / 255f,
                color.getGreen() / 255f,
                color.getBlue() / 255f
        );
    }

    private void setStrokeColor(PDPageContentStream content, Color color) throws IOException {
        content.setStrokingColor(
                color.getRed() / 255f,
                color.getGreen() / 255f,
                color.getBlue() / 255f
        );
    }

    private int widthToChars(float width) {
        return Math.max(4, (int) ((width - 6) / 4.8f));
    }

    private String truncate(String text, int maxLength) {
        if (text == null) {
            return "";
        }
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, Math.max(0, maxLength - 3)) + "...";
    }

    private String pdfText(PDType1Font font, String text) throws IOException {
        if (text == null || text.isBlank()) {
            return "";
        }

        String normalized = text
                .replace('\r', ' ')
                .replace('\n', ' ')
                .replace('\t', ' ');

        StringBuilder builder = new StringBuilder(normalized.length());
        for (int offset = 0; offset < normalized.length(); ) {
            int codePoint = normalized.codePointAt(offset);
            String candidate = new String(Character.toChars(codePoint));
            String safe = supportedGlyph(font, candidate);
            builder.append(safe != null ? safe : '?');
            offset += Character.charCount(codePoint);
        }
        return builder.toString();
    }

    private String supportedGlyph(PDType1Font font, String candidate) throws IOException {
        if (candidate.isBlank()) {
            return " ";
        }
        if (canEncode(font, candidate)) {
            return candidate;
        }

        String asciiFallback = Normalizer.normalize(candidate, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        if (!asciiFallback.isBlank() && canEncode(font, asciiFallback)) {
            return asciiFallback;
        }
        return null;
    }

    private boolean canEncode(PDType1Font font, String text) throws IOException {
        try {
            font.encode(text);
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private List<String> reportMetadata(LocalDate startDate, LocalDate endDate, int totalRows) {
        List<String> metadata = new ArrayList<>();
        metadata.add("Generado: " + DATE_TIME_FORMATTER.format(LocalDateTime.now()));
        metadata.add("Periodo: " + formatDateRange(startDate, endDate));
        metadata.add("Total registros: " + totalRows);
        return metadata;
    }

    private StringBuilder csvMetadata(String title, LocalDate startDate, LocalDate endDate, int totalRows) {
        StringBuilder csv = new StringBuilder("\uFEFF");
        csv.append(csv(title)).append('\n');
        csv.append(csv("Generado")).append(',').append(csv(DATE_TIME_FORMATTER.format(LocalDateTime.now()))).append('\n');
        csv.append(csv("Periodo")).append(',').append(csv(formatDateRange(startDate, endDate))).append('\n');
        csv.append(csv("Total registros")).append(',').append(csv(totalRows)).append('\n');
        csv.append('\n');
        return csv;
    }

    private String formatDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return "Sin filtro";
        }
        if (startDate == null) {
            return "Hasta " + DATE_FORMATTER.format(endDate);
        }
        if (endDate == null) {
            return "Desde " + DATE_FORMATTER.format(startDate);
        }
        return DATE_FORMATTER.format(startDate) + " al " + DATE_FORMATTER.format(endDate);
    }

    private String decimal(BigDecimal value) {
        return value == null ? "" : value.stripTrailingZeros().toPlainString();
    }

    private String safe(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new BusinessException("La fecha final no puede ser anterior a la fecha inicial");
        }
    }
}
