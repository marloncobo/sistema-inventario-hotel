package com.hotel.inventory.controller;

import com.hotel.inventory.dto.RoomParDtos.ReplenishmentSuggestion;
import com.hotel.inventory.service.ReplenishmentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/replenishment")
public class ReplenishmentController {

    private final ReplenishmentService replenishmentService;

    public ReplenishmentController(ReplenishmentService replenishmentService) {
        this.replenishmentService = replenishmentService;
    }

    @GetMapping("/suggestions")
    public List<ReplenishmentSuggestion> suggestions(
            @RequestParam(required = false) String roomNumber,
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) String roomType) {
        return replenishmentService.suggestions(roomNumber, scope, roomType);
    }
}
