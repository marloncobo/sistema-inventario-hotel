package com.hotel.rooms.service;

import com.hotel.rooms.dto.AssignSupplyRequest;
import com.hotel.rooms.dto.CreateRoomRequest;
import com.hotel.rooms.dto.InternalStockDecreaseRequest;
import com.hotel.rooms.dto.StockChangeResponse;
import com.hotel.rooms.exception.BusinessException;
import com.hotel.rooms.exception.NotFoundException;
import com.hotel.rooms.model.Room;
import com.hotel.rooms.model.RoomSupplyAssignment;
import com.hotel.rooms.repository.RoomRepository;
import com.hotel.rooms.repository.RoomSupplyAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RoomService {
    private final RoomRepository roomRepository;
    private final RoomSupplyAssignmentRepository assignmentRepository;
    private final RestClient inventoryRestClient;

    public RoomService(RoomRepository roomRepository, RoomSupplyAssignmentRepository assignmentRepository, RestClient inventoryRestClient) {
        this.roomRepository = roomRepository;
        this.assignmentRepository = assignmentRepository;
        this.inventoryRestClient = inventoryRestClient;
    }

    public Room createRoom(CreateRoomRequest request) {
        return roomRepository.save(new Room(request.number(), request.type(), request.status(), request.floor()));
    }

    public List<Room> listRooms() {
        return roomRepository.findAll();
    }

    public Room getRoom(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe la habitación con id " + id));
    }

    @Transactional
    public RoomSupplyAssignment assignSupply(Long roomId, AssignSupplyRequest request) {
        Room room = getRoom(roomId);

        StockChangeResponse stockResponse;
        try {
            stockResponse = inventoryRestClient.post()
                    .uri("/api/inventory/internal/items/decrease")
                    .body(new InternalStockDecreaseRequest(request.itemId(), request.quantity(), room.getNumber(), "Reparto a habitación " + room.getNumber()))
                    .retrieve()
                    .body(StockChangeResponse.class);
        } catch (RestClientResponseException ex) {
            throw new BusinessException("No fue posible descontar inventario: " + ex.getResponseBodyAsString());
        }

        if (stockResponse == null) {
            throw new BusinessException("No hubo respuesta del servicio de inventario");
        }

        RoomSupplyAssignment assignment = new RoomSupplyAssignment(
                room.getId(), room.getNumber(), request.itemId(), stockResponse.itemName(),
                request.quantity(), request.deliveredBy(), request.guestName(), LocalDateTime.now()
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
}