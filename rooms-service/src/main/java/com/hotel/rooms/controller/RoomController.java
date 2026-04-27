package com.hotel.rooms.controller;

import com.hotel.rooms.dto.AssignSupplyRequest;
import com.hotel.rooms.dto.CreateRoomRequest;
import com.hotel.rooms.dto.RoomConsumptionReport;
import com.hotel.rooms.dto.RoomDistributionReport;
import com.hotel.rooms.dto.RoomValidationResponse;
import com.hotel.rooms.exception.BusinessException;
import com.hotel.rooms.dto.UpdateRoomStatusRequest;
import com.hotel.rooms.model.Room;
import com.hotel.rooms.model.RoomSupplyAssignment;
import com.hotel.rooms.service.AuditService;
import com.hotel.rooms.service.RoomService;
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
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.awt.Color;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Color EXPORT_GOLD = new Color(200, 146, 45);
    private static final Color EXPORT_GOLD_LIGHT = new Color(230, 189, 106);
    private static final Color EXPORT_BROWN = new Color(61, 43, 31);
    private static final Color EXPORT_MUTED = new Color(138, 115, 92);
    private static final Color EXPORT_CREAM = new Color(253, 251, 247);
    private static final Color EXPORT_IVORY = new Color(245, 237, 225);
    private final RoomService roomService;
    private final AuditService auditService;

    public RoomController(RoomService roomService, AuditService auditService) {
        this.roomService = roomService;
        this.auditService = auditService;
    }

    @PostMapping
    public Room createRoom(@Valid @RequestBody CreateRoomRequest request, Authentication authentication) {
        return roomService.createRoom(request, username(authentication));
    }

    @GetMapping
    public List<Room> listRooms() {
        return roomService.listRooms();
    }

    @GetMapping("/{id}")
    public Room getRoom(@PathVariable Long id) {
        return roomService.getRoom(id);
    }

    @PutMapping("/{id}")
    public Room updateRoom(@PathVariable Long id, @Valid @RequestBody CreateRoomRequest request,
                           Authentication authentication) {
        return roomService.updateRoom(id, request, username(authentication));
    }

    @GetMapping("/number/{number}")
    public RoomValidationResponse getRoomByNumber(@PathVariable String number) {
        return roomService.getRoomByNumber(number);
    }

    @PatchMapping("/{id}/status")
    public Room updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateRoomStatusRequest request,
                             Authentication authentication) {
        return roomService.updateStatus(id, request, username(authentication));
    }

    @PostMapping("/{roomId}/supplies/assign")
    public RoomSupplyAssignment assignSupply(@PathVariable Long roomId, @Valid @RequestBody AssignSupplyRequest request,
                                             Authentication authentication) {
        return roomService.assignSupply(roomId, request, username(authentication));
    }

    @GetMapping("/{roomId}/supplies")
    public List<RoomSupplyAssignment> getRoomAssignments(@PathVariable Long roomId, Authentication authentication) {
        auditService.record("QUERY_ROOM_ASSIGNMENTS", "RoomSupplyAssignment", roomId, username(authentication), "Historial por habitacion");
        return roomService.getRoomAssignments(roomId);
    }

    @GetMapping("/supplies")
    public List<RoomSupplyAssignment> getAllAssignments(
            @RequestParam(required = false) String roomNumber,
            @RequestParam(required = false) String assignmentType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) {
        validateDateRange(startDate, endDate);
        auditService.record("QUERY_ASSIGNMENTS", "RoomSupplyAssignment", null, username(authentication), "Consulta global de asignaciones");
        return roomService.getAllAssignments(roomNumber, assignmentType, startDate, endDate);
    }

    @GetMapping("/reports/consumption")
    public List<RoomConsumptionReport> consumptionReport(
            @RequestParam(required = false) String roomNumber,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) String assignmentType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) {
        validateDateRange(startDate, endDate);
        auditService.record("GENERATE_ROOM_CONSUMPTION_REPORT", "RoomConsumptionReport", null, username(authentication), "Reporte consumo habitaciones");
        return roomService.consumptionReport(roomNumber, roomType, assignmentType, startDate, endDate);
    }

    @GetMapping("/reports/consumption/export")
    public ResponseEntity<byte[]> exportConsumptionReport(
            @RequestParam(defaultValue = "xlsx") String format,
            @RequestParam(required = false) String roomNumber,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) String assignmentType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) throws IOException {
        validateDateRange(startDate, endDate);
        String normalizedFormat = normalizeFormat(format);
        auditService.record("EXPORT_ROOM_CONSUMPTION_REPORT", "RoomConsumptionReport", null, username(authentication), "format=" + normalizedFormat);
        List<RoomConsumptionReport> rows = roomService.consumptionReport(roomNumber, roomType, assignmentType, startDate, endDate);
        if ("pdf".equals(normalizedFormat)) {
            return download("room-consumption-report.pdf", MediaType.APPLICATION_PDF, consumptionPdf(rows, roomNumber, roomType, assignmentType, startDate, endDate));
        }
        if ("csv".equals(normalizedFormat)) {
            return download("room-consumption-report.csv", new MediaType("text", "csv", StandardCharsets.UTF_8), consumptionCsv(rows, roomNumber, roomType, assignmentType, startDate, endDate));
        }
        return download("room-consumption-report.xlsx", MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), consumptionXlsx(rows, roomNumber, roomType, assignmentType, startDate, endDate));
    }

    @GetMapping("/reports/distribution")
    public List<RoomDistributionReport> distributionReport(
            @RequestParam(required = false) String roomNumber,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) String assignmentType,
            @RequestParam(required = false) String deliveredBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) {
        validateDateRange(startDate, endDate);
        auditService.record("GENERATE_ROOM_DISTRIBUTION_REPORT", "RoomDistributionReport", null, username(authentication), "Reporte distribucion habitaciones");
        return roomService.distributionReport(roomNumber, roomType, assignmentType, deliveredBy, startDate, endDate);
    }

    @GetMapping("/reports/distribution/export")
    public ResponseEntity<byte[]> exportDistributionReport(
            @RequestParam(defaultValue = "xlsx") String format,
            @RequestParam(required = false) String roomNumber,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) String assignmentType,
            @RequestParam(required = false) String deliveredBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) throws IOException {
        validateDateRange(startDate, endDate);
        String normalizedFormat = normalizeFormat(format);
        auditService.record("EXPORT_ROOM_DISTRIBUTION_REPORT", "RoomDistributionReport", null, username(authentication), "format=" + normalizedFormat);
        List<RoomDistributionReport> rows = roomService.distributionReport(roomNumber, roomType, assignmentType, deliveredBy, startDate, endDate);
        if ("pdf".equals(normalizedFormat)) {
            return download("room-distribution-report.pdf", MediaType.APPLICATION_PDF, distributionPdf(rows, roomNumber, roomType, assignmentType, deliveredBy, startDate, endDate));
        }
        if ("csv".equals(normalizedFormat)) {
            return download("room-distribution-report.csv", new MediaType("text", "csv", StandardCharsets.UTF_8), distributionCsv(rows, roomNumber, roomType, assignmentType, deliveredBy, startDate, endDate));
        }
        return download("room-distribution-report.xlsx", MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), distributionXlsx(rows, roomNumber, roomType, assignmentType, deliveredBy, startDate, endDate));
    }

    private String username(Authentication authentication) {
        return authentication == null ? "sistema" : authentication.getName();
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

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new BusinessException("La fecha final no puede ser anterior a la fecha inicial");
        }
    }

    private byte[] consumptionCsv(List<RoomConsumptionReport> rows, String roomNumber, String roomType, String assignmentType, LocalDate startDate, LocalDate endDate) {
        StringBuilder csv = csvMetadata("Reporte de consumo por habitacion", startDate, endDate, rows.size(),
                java.util.Arrays.asList(filter("Habitacion", roomNumber), filter("Tipo habitacion", roomType), filter("Tipo asignacion", assignmentType)));
        csv.append("Habitacion,Tipo habitacion,Insumo,Tipo asignacion,Entregado por,Cantidad total\n");
        rows.forEach(row -> csv.append(csv(row.roomNumber())).append(',').append(csv(row.roomType())).append(',')
                .append(csv(row.itemName())).append(',').append(csv(row.assignmentType())).append(',').append(csv(row.deliveredBy())).append(',')
                .append(csv(row.totalQuantity())).append('\n'));
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

    private byte[] consumptionXlsx(List<RoomConsumptionReport> rows, String roomNumber, String roomType, String assignmentType, LocalDate startDate, LocalDate endDate) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Consumo habitaciones");
            writeWorkbookReport(
                    workbook,
                    sheet,
                    "Reporte de consumo por habitacion",
                    startDate,
                    endDate,
                    rows.size(),
                    java.util.Arrays.asList(filter("Habitacion", roomNumber), filter("Tipo habitacion", roomType), filter("Tipo asignacion", assignmentType)),
                    List.of("Habitacion", "Tipo habitacion", "Insumo", "Tipo asignacion", "Entregado por", "Cantidad total"),
                    rows,
                    List.of(
                            RoomConsumptionReport::roomNumber,
                            RoomConsumptionReport::roomType,
                            RoomConsumptionReport::itemName,
                            RoomConsumptionReport::assignmentType,
                            RoomConsumptionReport::deliveredBy,
                            RoomConsumptionReport::totalQuantity
                    )
            );
            workbook.write(output);
            return output.toByteArray();
        }
    }

    private byte[] distributionCsv(List<RoomDistributionReport> rows, String roomNumber, String roomType, String assignmentType,
                                   String deliveredBy, LocalDate startDate, LocalDate endDate) {
        StringBuilder csv = csvMetadata("Reporte de distribucion por habitaciones", startDate, endDate, rows.size(),
                java.util.Arrays.asList(
                        filter("Habitacion", roomNumber),
                        filter("Tipo habitacion", roomType),
                        filter("Tipo asignacion", assignmentType),
                        filter("Entregado por", deliveredBy)
                ));
        csv.append("Habitacion,Tipo habitacion,Insumo,Cantidad,Tipo asignacion,Entregado por,Huesped,Fecha entrega\n");
        rows.forEach(row -> csv.append(csv(row.roomNumber())).append(',').append(csv(row.roomType())).append(',')
                .append(csv(row.itemName())).append(',').append(csv(row.quantity())).append(',').append(csv(row.assignmentType())).append(',')
                .append(csv(row.deliveredBy())).append(',').append(csv(row.guestName())).append(',').append(csv(formatDateTime(row.deliveredAt()))).append('\n'));
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] distributionXlsx(List<RoomDistributionReport> rows, String roomNumber, String roomType, String assignmentType,
                                    String deliveredBy, LocalDate startDate, LocalDate endDate) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Distribucion habitaciones");
            writeWorkbookReport(
                    workbook,
                    sheet,
                    "Reporte de distribucion por habitaciones",
                    startDate,
                    endDate,
                    rows.size(),
                    java.util.Arrays.asList(
                            filter("Habitacion", roomNumber),
                            filter("Tipo habitacion", roomType),
                            filter("Tipo asignacion", assignmentType),
                            filter("Entregado por", deliveredBy)
                    ),
                    List.of("Habitacion", "Tipo habitacion", "Insumo", "Cantidad", "Tipo asignacion", "Entregado por", "Huesped", "Fecha entrega"),
                    rows,
                    List.of(
                            RoomDistributionReport::roomNumber,
                            RoomDistributionReport::roomType,
                            RoomDistributionReport::itemName,
                            RoomDistributionReport::quantity,
                            RoomDistributionReport::assignmentType,
                            RoomDistributionReport::deliveredBy,
                            RoomDistributionReport::guestName,
                            row -> formatDateTime(row.deliveredAt())
                    )
            );
            workbook.write(output);
            return output.toByteArray();
        }
    }

    private byte[] consumptionPdf(List<RoomConsumptionReport> rows, String roomNumber, String roomType, String assignmentType,
                                  LocalDate startDate, LocalDate endDate) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            writePdfTable(
                    document,
                    "Reporte de consumo por habitacion",
                    reportMetadata(
                            startDate,
                            endDate,
                            rows.size(),
                            java.util.Arrays.asList(filter("Habitacion", roomNumber), filter("Tipo habitacion", roomType), filter("Tipo asignacion", assignmentType))
                    ),
                    List.of("Habitacion", "Tipo", "Insumo", "Asignacion", "Entregado por", "Total"),
                    List.of(70f, 90f, 180f, 95f, 130f, 50f),
                    rows.stream()
                            .map(row -> List.of(
                                    safe(row.roomNumber()),
                                    safe(row.roomType()),
                                    safe(row.itemName()),
                                    safe(row.assignmentType()),
                                    safe(row.deliveredBy()),
                                    safe(row.totalQuantity())
                            ))
                            .toList()
            );
            document.save(output);
            return output.toByteArray();
        }
    }

    private byte[] distributionPdf(List<RoomDistributionReport> rows, String roomNumber, String roomType, String assignmentType,
                                   String deliveredBy, LocalDate startDate, LocalDate endDate) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            writePdfTable(
                    document,
                    "Reporte de distribucion por habitaciones",
                    reportMetadata(
                            startDate,
                            endDate,
                            rows.size(),
                            java.util.Arrays.asList(
                                    filter("Habitacion", roomNumber),
                                    filter("Tipo habitacion", roomType),
                                    filter("Tipo asignacion", assignmentType),
                                    filter("Entregado por", deliveredBy)
                            )
                    ),
                    List.of("Habitacion", "Tipo", "Insumo", "Cant.", "Entregado por", "Huesped", "Fecha"),
                    List.of(60f, 70f, 155f, 45f, 110f, 120f, 90f),
                    rows.stream()
                            .map(row -> List.of(
                                    safe(row.roomNumber()),
                                    safe(row.roomType()),
                                    safe(row.itemName()),
                                    safe(row.quantity()),
                                    safe(row.deliveredBy()),
                                    safe(row.guestName()),
                                    formatDateTime(row.deliveredAt())
                            ))
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
            List<String> extraMetadata,
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

        for (String metadata : reportMetadata(startDate, endDate, totalRows, extraMetadata)) {
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
                writeCell(dataRow.createCell(i), extractors.get(i).apply(row), rowStyle);
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
            setFillColor(content, EXPORT_BROWN);
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

    private List<String> reportMetadata(LocalDate startDate, LocalDate endDate, int totalRows, List<String> extraMetadata) {
        List<String> metadata = new ArrayList<>();
        metadata.add("Generado: " + DATE_TIME_FORMATTER.format(LocalDateTime.now()));
        metadata.add("Periodo: " + formatDateRange(startDate, endDate));
        metadata.add("Total registros: " + totalRows);
        extraMetadata.stream().filter(line -> line != null && !line.isBlank()).forEach(metadata::add);
        return metadata;
    }

    private StringBuilder csvMetadata(String title, LocalDate startDate, LocalDate endDate, int totalRows, List<String> extraMetadata) {
        StringBuilder csv = new StringBuilder("\uFEFF");
        csv.append(csv(title)).append('\n');
        csv.append(csv("Generado")).append(',').append(csv(DATE_TIME_FORMATTER.format(LocalDateTime.now()))).append('\n');
        csv.append(csv("Periodo")).append(',').append(csv(formatDateRange(startDate, endDate))).append('\n');
        csv.append(csv("Total registros")).append(',').append(csv(totalRows)).append('\n');
        extraMetadata.stream().filter(line -> line != null && !line.isBlank()).forEach(line -> csv.append(csv(line)).append('\n'));
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

    private String filter(String label, String value) {
        return value == null || value.isBlank() ? null : label + ": " + value;
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? "" : DATE_TIME_FORMATTER.format(value);
    }

    private String safe(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
