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
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
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
            return download("room-consumption-report.pdf", MediaType.APPLICATION_PDF, consumptionPdf(rows));
        }
        if ("csv".equals(normalizedFormat)) {
            return download("room-consumption-report.csv", new MediaType("text", "csv", StandardCharsets.UTF_8), consumptionCsv(rows));
        }
        return download("room-consumption-report.xlsx", MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), consumptionXlsx(rows));
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
            return download("room-distribution-report.pdf", MediaType.APPLICATION_PDF, distributionPdf(rows));
        }
        if ("csv".equals(normalizedFormat)) {
            return download("room-distribution-report.csv", new MediaType("text", "csv", StandardCharsets.UTF_8), distributionCsv(rows));
        }
        return download("room-distribution-report.xlsx", MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), distributionXlsx(rows));
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

    private byte[] consumptionCsv(List<RoomConsumptionReport> rows) {
        StringBuilder csv = new StringBuilder("roomNumber,roomType,itemId,itemName,assignmentType,deliveredBy,totalQuantity\n");
        rows.forEach(row -> csv.append(csv(row.roomNumber())).append(',').append(csv(row.roomType())).append(',').append(csv(row.itemId())).append(',')
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

    private byte[] consumptionXlsx(List<RoomConsumptionReport> rows) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Consumo habitaciones");
            Row header = sheet.createRow(0);
            String[] headers = {"roomNumber", "roomType", "itemId", "itemName", "assignmentType", "deliveredBy", "totalQuantity"};
            for (int i = 0; i < headers.length; i++) header.createCell(i).setCellValue(headers[i]);
            for (int i = 0; i < rows.size(); i++) {
                RoomConsumptionReport row = rows.get(i);
                Row excelRow = sheet.createRow(i + 1);
                excelRow.createCell(0).setCellValue(row.roomNumber());
                excelRow.createCell(1).setCellValue(row.roomType());
                excelRow.createCell(2).setCellValue(row.itemId());
                excelRow.createCell(3).setCellValue(row.itemName());
                excelRow.createCell(4).setCellValue(row.assignmentType());
                excelRow.createCell(5).setCellValue(row.deliveredBy());
                excelRow.createCell(6).setCellValue(row.totalQuantity());
            }
            workbook.write(output);
            return output.toByteArray();
        }
    }

    private byte[] distributionCsv(List<RoomDistributionReport> rows) {
        StringBuilder csv = new StringBuilder("roomNumber,roomType,itemId,itemName,quantity,assignmentType,deliveredBy,guestName,deliveredAt\n");
        rows.forEach(row -> csv.append(csv(row.roomNumber())).append(',').append(csv(row.roomType())).append(',').append(csv(row.itemId())).append(',')
                .append(csv(row.itemName())).append(',').append(csv(row.quantity())).append(',').append(csv(row.assignmentType())).append(',')
                .append(csv(row.deliveredBy())).append(',').append(csv(row.guestName())).append(',').append(csv(row.deliveredAt())).append('\n'));
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] distributionXlsx(List<RoomDistributionReport> rows) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Distribucion habitaciones");
            Row header = sheet.createRow(0);
            String[] headers = {"roomNumber", "roomType", "itemId", "itemName", "quantity", "assignmentType", "deliveredBy", "guestName", "deliveredAt"};
            for (int i = 0; i < headers.length; i++) header.createCell(i).setCellValue(headers[i]);
            for (int i = 0; i < rows.size(); i++) {
                RoomDistributionReport row = rows.get(i);
                Row excelRow = sheet.createRow(i + 1);
                excelRow.createCell(0).setCellValue(row.roomNumber());
                excelRow.createCell(1).setCellValue(row.roomType());
                excelRow.createCell(2).setCellValue(row.itemId());
                excelRow.createCell(3).setCellValue(row.itemName());
                excelRow.createCell(4).setCellValue(row.quantity());
                excelRow.createCell(5).setCellValue(row.assignmentType());
                excelRow.createCell(6).setCellValue(row.deliveredBy());
                excelRow.createCell(7).setCellValue(row.guestName());
                excelRow.createCell(8).setCellValue(row.deliveredAt() == null ? "" : row.deliveredAt().toString());
            }
            workbook.write(output);
            return output.toByteArray();
        }
    }

    private byte[] consumptionPdf(List<RoomConsumptionReport> rows) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            writePdfLines(document, "Reporte de consumo por habitacion", rows.stream()
                    .map(row -> row.roomNumber() + " (" + row.roomType() + ") - " + row.itemName() + " | " + row.assignmentType() + " | entrego: " + row.deliveredBy() + " | total: " + row.totalQuantity())
                    .toList());
            document.save(output);
            return output.toByteArray();
        }
    }

    private byte[] distributionPdf(List<RoomDistributionReport> rows) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            writePdfLines(document, "Reporte de distribucion por habitaciones", rows.stream()
                    .map(row -> row.roomNumber() + " (" + row.roomType() + ") - " + row.itemName()
                            + " | cantidad: " + row.quantity() + " | entrego: " + row.deliveredBy()
                            + " | fecha: " + row.deliveredAt())
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
}
