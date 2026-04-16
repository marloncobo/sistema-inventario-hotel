package com.hotel.rooms.service;

import com.hotel.rooms.client.InventoryClient;
import com.hotel.rooms.dto.AssignSupplyRequest;
import com.hotel.rooms.dto.CreateRoomRequest;
import com.hotel.rooms.dto.InternalStockDecreaseRequest;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class RoomService {
    private final RoomRepository roomRepository;
    private final RoomSupplyAssignmentRepository assignmentRepository;
    private final InventoryClient inventoryClient;

    public RoomService(RoomRepository roomRepository, RoomSupplyAssignmentRepository assignmentRepository, InventoryClient inventoryClient) {
        this.roomRepository = roomRepository;
        this.assignmentRepository = assignmentRepository;
        this.inventoryClient = inventoryClient;
    }

    public Room createRoom(CreateRoomRequest request) {
        validateRoomType(request.type());
        validateRoomStatus(request.status());
        if (roomRepository.existsByNumber(request.number())) {
            throw new BusinessException("Ya existe una habitacion con numero " + request.number());
        }
        return roomRepository.save(new Room(
                request.number(), normalize(request.type()), normalize(request.status()),
                request.capacity(), request.floor(), request.observations()
        ));
    }

    public List<Room> listRooms() {
        return roomRepository.findAll();
    }

    public Room getRoom(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe la habitacion con id " + id));
    }

    @Transactional
    public Room updateStatus(Long id, UpdateRoomStatusRequest request) {
        validateRoomStatus(request.status());
        Room room = getRoom(id);
        room.setStatus(normalize(request.status()));
        return roomRepository.save(room);
    }

    @Transactional
    public RoomSupplyAssignment assignSupply(Long roomId, AssignSupplyRequest request) {
        Room room = getRoom(roomId);
        if ("FUERA_DE_SERVICIO".equals(room.getStatus()) || "MANTENIMIENTO".equals(room.getStatus())) {
            throw new BusinessException("La habitacion no esta habilitada para recibir insumos");
        }

        StockChangeResponse stockResponse;
        try {
            stockResponse = inventoryClient.decreaseStock(new InternalStockDecreaseRequest(
                    request.itemId(), request.quantity(), room.getNumber(), null, "HABITACION",
                    request.deliveredBy(), referenceText(room, request)
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
                room.getId(), room.getNumber(), request.itemId(), stockResponse.itemName(),
                request.quantity(), request.deliveredBy(), request.guestName(),
                normalizeAssignmentType(request.assignmentType()), LocalDateTime.now()
        );
        return assignmentRepository.save(assignment);
    }

    public List<RoomSupplyAssignment> getRoomAssignments(Long roomId) {
        getRoom(roomId);
        return assignmentRepository.findByRoomId(roomId);
    }

    public List<RoomSupplyAssignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    private String referenceText(Room room, AssignSupplyRequest request) {
        return normalizeAssignmentType(request.assignmentType()) + " habitacion " + room.getNumber();
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

    private void validateRoomStatus(String status) {
        String normalized = normalize(status);
        if (!List.of("DISPONIBLE", "OCUPADA", "EN_LIMPIEZA", "MANTENIMIENTO", "FUERA_DE_SERVICIO").contains(normalized)) {
            throw new BusinessException("Estado de habitacion no valido: " + status);
        }
    }

    private String normalize(String value) {
        return value.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
    }

    private String responseMessage(RestClientResponseException ex) {
        String body = ex.getResponseBodyAsString();
        if (body == null || body.isBlank()) {
            return "HTTP " + ex.getStatusCode().value();
        }
        return body;
    }
}
