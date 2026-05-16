package com.hotel.inventory.controller;

import com.hotel.inventory.dto.CreateLocationRequest;
import com.hotel.inventory.dto.UpdateLocationRequest;
import com.hotel.inventory.model.Location;
import com.hotel.inventory.service.LocationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CRUD de ubicaciones físicas del inventario.
 *
 * Ubicaciones son la base del refactor de Fase 1: cualquier lugar donde puede
 * haber inventario (bodega, piso, carrito, habitación, minibar, lavandería).
 */
@RestController
@RequestMapping("/api/inventory/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping
    public List<Location> list(@RequestParam(value = "type", required = false) String type,
                               @RequestParam(value = "activeOnly", required = false) Boolean activeOnly) {
        return locationService.list(type, activeOnly);
    }

    @GetMapping("/{id}")
    public Location get(@PathVariable Long id) {
        return locationService.get(id);
    }

    @GetMapping("/code/{code}")
    public Location getByCode(@PathVariable String code) {
        return locationService.getByCode(code);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
    public ResponseEntity<Location> create(@Valid @RequestBody CreateLocationRequest request,
                                           Authentication authentication) {
        Location created = locationService.create(request, authentication.getName());
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
    public Location update(@PathVariable Long id,
                           @Valid @RequestBody UpdateLocationRequest request,
                           Authentication authentication) {
        return locationService.update(id, request, authentication.getName());
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public Location deactivate(@PathVariable Long id, Authentication authentication) {
        return locationService.deactivate(id, authentication.getName());
    }
}
