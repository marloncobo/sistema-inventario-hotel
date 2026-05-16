package com.hotel.inventory.controller;

import com.hotel.inventory.dto.RoomParDtos.CreateRoomParRequest;
import com.hotel.inventory.dto.RoomParDtos.RoomParComparisonView;
import com.hotel.inventory.dto.RoomParDtos.UpdateRoomParRequest;
import com.hotel.inventory.model.RoomPar;
import com.hotel.inventory.service.RoomParService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/room-pars")
public class RoomParController {

    private final RoomParService roomParService;

    public RoomParController(RoomParService roomParService) {
        this.roomParService = roomParService;
    }

    @GetMapping
    public List<RoomPar> list(@RequestParam(value = "activeOnly", required = false, defaultValue = "true") Boolean activeOnly) {
        return roomParService.list(activeOnly);
    }

    @GetMapping("/{id}")
    public RoomPar get(@PathVariable Long id) {
        return roomParService.get(id);
    }

    @GetMapping("/compare")
    public RoomParComparisonView compare(
            @RequestParam String roomNumber,
            @RequestParam String scope) {
        return roomParService.compareRoom(roomNumber, scope);
    }

    @GetMapping("/compare-by-type")
    public RoomParComparisonView compareByType(
            @RequestParam String roomType,
            @RequestParam String scope) {
        return roomParService.compareByType(roomType, scope);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
    public ResponseEntity<RoomPar> create(@Valid @RequestBody CreateRoomParRequest request,
                                          Authentication authentication) {
        RoomPar par = roomParService.create(request, authentication.getName());
        return ResponseEntity.status(201).body(par);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
    public RoomPar update(@PathVariable Long id,
                          @Valid @RequestBody UpdateRoomParRequest request,
                          Authentication authentication) {
        return roomParService.update(id, request, authentication.getName());
    }
}
