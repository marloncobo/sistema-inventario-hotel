package com.hotel.inventory.controller;

import com.hotel.inventory.dto.CatalogRequest;
import com.hotel.inventory.model.Area;
import com.hotel.inventory.model.Category;
import com.hotel.inventory.model.Provider;
import com.hotel.inventory.model.UnitOfMeasure;
import com.hotel.inventory.service.CatalogService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/catalogs")
public class CatalogController {
    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/categories")
    public List<Category> categories() { return catalogService.categories(); }

    @PostMapping("/categories")
    public Category createCategory(@Valid @RequestBody CatalogRequest request, Authentication authentication) {
        return catalogService.createCategory(request, username(authentication));
    }

    @PutMapping("/categories/{id}")
    public Category updateCategory(@PathVariable Long id, @Valid @RequestBody CatalogRequest request, Authentication authentication) {
        return catalogService.updateCategory(id, request, username(authentication));
    }

    @GetMapping("/units")
    public List<UnitOfMeasure> units() { return catalogService.units(); }

    @PostMapping("/units")
    public UnitOfMeasure createUnit(@Valid @RequestBody CatalogRequest request, Authentication authentication) {
        return catalogService.createUnit(request, username(authentication));
    }

    @PutMapping("/units/{id}")
    public UnitOfMeasure updateUnit(@PathVariable Long id, @Valid @RequestBody CatalogRequest request, Authentication authentication) {
        return catalogService.updateUnit(id, request, username(authentication));
    }

    @GetMapping("/providers")
    public List<Provider> providers() { return catalogService.providers(); }

    @PostMapping("/providers")
    public Provider createProvider(@Valid @RequestBody CatalogRequest request, Authentication authentication) {
        return catalogService.createProvider(request, username(authentication));
    }

    @PutMapping("/providers/{id}")
    public Provider updateProvider(@PathVariable Long id, @Valid @RequestBody CatalogRequest request, Authentication authentication) {
        return catalogService.updateProvider(id, request, username(authentication));
    }

    @GetMapping("/areas")
    public List<Area> areas() { return catalogService.areas(); }

    @PostMapping("/areas")
    public Area createArea(@Valid @RequestBody CatalogRequest request, Authentication authentication) {
        return catalogService.createArea(request, username(authentication));
    }

    @PutMapping("/areas/{id}")
    public Area updateArea(@PathVariable Long id, @Valid @RequestBody CatalogRequest request, Authentication authentication) {
        return catalogService.updateArea(id, request, username(authentication));
    }

    private String username(Authentication authentication) {
        return authentication == null ? "sistema" : authentication.getName();
    }
}
