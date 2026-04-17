package com.hotel.rooms.service;

import com.hotel.rooms.client.InventoryClient;
import com.hotel.rooms.dto.AssignSupplyRequest;
import com.hotel.rooms.dto.CreateRoomRequest;
import com.hotel.rooms.dto.InternalStockDecreaseRequest;
import com.hotel.rooms.dto.InventoryItemResponse;
import com.hotel.rooms.dto.RoomValidationResponse;
import com.hotel.rooms.dto.RoomConsumptionReport;
import com.hotel.rooms.dto.RoomDistributionReport;
import com.hotel.rooms.dto.StockChangeResponse;
import com.hotel.rooms.dto.UpdateRoomStatusRequest;
import com.hotel.rooms.exception.BusinessException;
import com.hotel.rooms.exception.NotFoundException;
import com.hotel.rooms.model.Room;
import com.hotel.rooms.model.RoomSupplyAssignment;
import com.hotel.rooms.repository.RoomRepository;
import com.hotel.rooms.repository.RoomSupplyAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class RoomService {
    private static final LocalDateTime MIN_DATE = LocalDateTime.of(1900, 1, 1, 0, 0);
    private static final LocalDateTime MAX_DATE = LocalDateTime.of(9999, 12, 31, 23, 59, 59);

    private final RoomRepository roomRepository;
    private final RoomSupplyAssignmentRepository assignmentRepository;
    private final InventoryClient inventoryClient;
    private final AuditService auditService;

    public RoomService(RoomRepository roomRepository, RoomSupplyAssignmentRepository assignmentRepository,
                       InventoryClient inventoryClient, AuditService auditService) {
        this.roomRepository = roomRepository;
        this.assignmentRepository = assignmentRepository;
        this.inventoryClient = inventoryClient;
        this.auditService = auditService;
    }

    public Room createRoom(CreateRoomRequest request, String username) {
        validateRoomType(request.type());
        validateCapacity(request.type(), request.capacity());
        validateRoomStatus(request.status());
        if (roomRepository.existsByNumber(request.number())) {
            throw new BusinessException("Ya existe una habitacion con numero " + request.number());
        }
        if (roomRepository.countByActiveTrue() >= 45) {
            throw new BusinessException("El hotel tiene configurado un maximo de 45 habitaciones activas");
        }
        Room saved = roomRepository.save(new Room(
                request.number(), normalize(request.type()), normalize(request.status()),
                request.capacity(), request.floor(), request.observations()
        ));
        auditService.record("CREATE", "Room", saved.getId(), username, saved.getNumber());
        return saved;
    }

    public List<Room> listRooms() {
        return roomRepository.findAll();
    }

    public Room getRoom(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe la habitacion con id " + id));
    }

    public RoomValidationResponse getRoomByNumber(String number) {
        Room room = roomRepository.findByNumber(number)
                .orElseThrow(() -> new NotFoundException("No existe la habitacion con numero " + number));
        return new RoomValidationResponse(room.getNumber(), room.getType(), room.getStatus(), room.getActive());
    }

    @Transactional
    public Room updateStatus(Long id, UpdateRoomStatusRequest request, String username) {
        validateRoomStatus(request.status());
        Room room = getRoom(id);
        room.setStatus(normalize(request.status()));
        Room saved = roomRepository.save(room);
        auditService.record("UPDATE_STATUS", "Room", saved.getId(), username, saved.getNumber() + " -> " + saved.getStatus());
        return saved;
    }

    @Transactional
    public RoomSupplyAssignment assignSupply(Long roomId, AssignSupplyRequest request, String username) {
        Room room = getRoom(roomId);
        if (!Boolean.TRUE.equals(room.getActive())) {
            throw new BusinessException("La habitacion esta inactiva");
        }
        if ("FUERA_DE_SERVICIO".equals(room.getStatus()) || "MANTENIMIENTO".equals(room.getStatus())) {
            throw new BusinessException("La habitacion no esta habilitada para recibir insumos");
        }

        String assignmentType = normalizeAssignmentType(request.assignmentType());
        InventoryItemResponse item = getInventoryItem(request.itemId());
        validateAssignmentCategory(assignmentType, item);

        StockChangeResponse stockResponse;
        try {
            stockResponse = inventoryClient.decreaseStock(new InternalStockDecreaseRequest(
                    request.itemId(), request.quantity(), room.getNumber(), null, "HABITACION",
                    request.deliveredBy(), referenceText(room, assignmentType)
            ));
        } catch (RestClientResponseException ex) {
            throw new BusinessException("No fue posible descontar inventario: " + responseMessage(ex));
        } catch (RestClientException ex) {
            throw new BusinessException("No fue posible comunicarse con el servicio de inventario: " + ex.getMessage());
        }

        if (stockResponse == null) {
            throw new BusinessException("No hubo respuesta del servicio de inventario");
        }

        RoomSupplyAssignment assignment = new RoomSupplyAssignment(
                room, request.itemId(), stockResponse.itemName(),
                request.quantity(), request.deliveredBy(), request.guestName(),
                assignmentType, LocalDateTime.now()
        );
        RoomSupplyAssignment saved = assignmentRepository.save(assignment);
        auditService.record("ASSIGN_SUPPLY", "RoomSupplyAssignment", saved.getId(), username,
                request.deliveredBy() + " entrego " + request.quantity() + " a habitacion " + room.getNumber());
        return saved;
    }

    public List<RoomSupplyAssignment> getRoomAssignments(Long roomId) {
        getRoom(roomId);
        return assignmentRepository.findByRoomId(roomId);
    }

    public List<RoomSupplyAssignment> getAllAssignments(String roomNumber, String assignmentType, LocalDate startDate, LocalDate endDate) {
        return assignmentRepository.search(
                blankToWildcardLower(roomNumber),
                blankToWildcardLower(assignmentType),
                startDate == null ? MIN_DATE : startDate.atStartOfDay(),
                endDate == null ? MAX_DATE : endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
    }

    public List<RoomConsumptionReport> consumptionReport(String roomNumber, String roomType, String assignmentType, LocalDate startDate, LocalDate endDate) {
        return assignmentRepository.consumptionReport(
                blankToWildcardLower(roomNumber),
                blankToWildcardLower(roomType),
                blankToWildcardLower(assignmentType),
                startDate == null ? MIN_DATE : startDate.atStartOfDay(),
                endDate == null ? MAX_DATE : endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
    }

    public List<RoomDistributionReport> distributionReport(String roomNumber, String roomType, String assignmentType,
                                                           String deliveredBy, LocalDate startDate, LocalDate endDate) {
        return assignmentRepository.distributionReport(
                blankToWildcardLower(roomNumber),
                blankToWildcardLower(roomType),
                blankToWildcardLower(assignmentType),
                blankToWildcardLower(deliveredBy),
                startDate == null ? MIN_DATE : startDate.atStartOfDay(),
                endDate == null ? MAX_DATE : endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
    }

    private String referenceText(Room room, String assignmentType) {
        return assignmentType + " habitacion " + room.getNumber();
    }

    private InventoryItemResponse getInventoryItem(Long itemId) {
        try {
            InventoryItemResponse item = inventoryClient.getItem(itemId);
            if (item == null) {
                throw new BusinessException("No hubo respuesta del servicio de inventario");
            }
            return item;
        } catch (RestClientResponseException ex) {
            throw new BusinessException("No fue posible consultar inventario: " + responseMessage(ex));
        } catch (RestClientException ex) {
            throw new BusinessException("No fue posible comunicarse con el servicio de inventario: " + ex.getMessage());
        }
    }

    private void validateAssignmentCategory(String assignmentType, InventoryItemResponse item) {
        if (!Boolean.TRUE.equals(item.active())) {
            throw new BusinessException("El insumo esta inactivo");
        }
        String category = normalize(item.category());
        if ("MINIBAR".equals(assignmentType) && !"MINIBAR".equals(category)) {
            throw new BusinessException("Solo se pueden reponer productos de categoria MINIBAR en minibar");
        }
        if ("KIT_ASEO".equals(assignmentType) && !List.of("ASEO", "AMENIDADES").contains(category)) {
            throw new BusinessException("Solo se pueden entregar insumos de aseo o amenidades en kits de aseo");
        }
        if ("SERVICIO_HABITACION".equals(assignmentType) && List.of("LENCERIA", "MANTENIMIENTO").contains(category)) {
            throw new BusinessException("El servicio a la habitacion no permite esta categoria de insumo");
        }
    }

    private String normalizeAssignmentType(String value) {
        if (value == null || value.isBlank()) {
            return "HABITACION";
        }
        String normalized = normalize(value);
        if (!List.of("HABITACION", "MINIBAR", "KIT_ASEO", "SERVICIO_HABITACION").contains(normalized)) {
            throw new BusinessException("Tipo de entrega no valido: " + value);
        }
        return normalized;
    }

    private void validateRoomType(String type) {
        String normalized = normalize(type);
        if (!List.of("ESTANDAR", "EJECUTIVA", "FAMILIAR").contains(normalized)) {
            throw new BusinessException("Tipo de habitacion no valido: " + type);
        }
    }

    private void validateCapacity(String type, Integer capacity) {
        String normalized = normalize(type);
        if ("FAMILIAR".equals(normalized) && capacity < 3) {
            throw new BusinessException("La habitacion familiar debe tener capacidad minima de 3 personas");
        }
    }

    private void validateRoomStatus(String status) {
        String normalized = normalize(status);
        if (!List.of("DISPONIBLE", "OCUPADA", "EN_LIMPIEZA", "MANTENIMIENTO", "FUERA_DE_SERVICIO").contains(normalized)) {
            throw new BusinessException("Estado de habitacion no valido: " + status);
        }
    }

    private String normalize(String value) {
        return value.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
    }

    private String blankToNullLower(String value) {
        return value == null || value.isBlank() ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private String blankToWildcardLower(String value) {
        return value == null || value.isBlank() ? "%" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String responseMessage(RestClientResponseException ex) {
        String body = ex.getResponseBodyAsString();
        if (body == null || body.isBlank()) {
            return "HTTP " + ex.getStatusCode().value();
        }
        return body;
    }
}
