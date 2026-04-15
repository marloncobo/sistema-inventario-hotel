package com.hotel.rooms.controller;

import com.hotel.rooms.dto.AssignSupplyRequest;
import com.hotel.rooms.dto.CreateRoomRequest;
import com.hotel.rooms.model.Room;
import com.hotel.rooms.model.RoomSupplyAssignment;
import com.hotel.rooms.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public Room createRoom(@Valid @RequestBody CreateRoomRequest request) {
        return roomService.createRoom(request);
    }

    @GetMapping
    public List<Room> listRooms() {
        return roomService.listRooms();
    }

    @GetMapping("/{id}")
    public Room getRoom(@PathVariable Long id) {
        return roomService.getRoom(id);
    }

    @PostMapping("/{roomId}/supplies/assign")
    public RoomSupplyAssignment assignSupply(@PathVariable Long roomId, @Valid @RequestBody AssignSupplyRequest request) {
        return roomService.assignSupply(roomId, request);
    }

    @GetMapping("/{roomId}/supplies")
    public List<RoomSupplyAssignment> getRoomAssignments(@PathVariable Long roomId) {
        return roomService.getRoomAssignments(roomId);
    }

    @GetMapping("/supplies")
    public List<RoomSupplyAssignment> getAllAssignments() {
        return roomService.getAllAssignments();
    }
}