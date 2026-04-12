package com.lunara.masterdata.controller;

import com.lunara.masterdata.dto.MasterDataDtos;
import com.lunara.masterdata.model.*;
import com.lunara.masterdata.service.MasterDataService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api")
public class MasterDataController {
    private final MasterDataService masterDataService;
    public MasterDataController(MasterDataService masterDataService) { this.masterDataService = masterDataService; }

    @GetMapping("/areas") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<Area> areas() { return masterDataService.getAreas(); }
    @PostMapping("/areas") @PreAuthorize("hasAuthority('ROLE_ADMIN')") public Area createArea(@Valid @RequestBody MasterDataDtos.AreaRequest request) { return masterDataService.createArea(request); }

    @GetMapping("/warehouses") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<Warehouse> warehouses() { return masterDataService.getWarehouses(); }
    @PostMapping("/warehouses") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public Warehouse createWarehouse(@Valid @RequestBody MasterDataDtos.WarehouseRequest request) { return masterDataService.createWarehouse(request); }

    @GetMapping("/categories") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<Category> categories() { return masterDataService.getCategories(); }
    @PostMapping("/categories") @PreAuthorize("hasAuthority('ROLE_ADMIN')") public Category createCategory(@Valid @RequestBody MasterDataDtos.CategoryRequest request) { return masterDataService.createCategory(request); }

    @GetMapping("/units") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<Unit> units() { return masterDataService.getUnits(); }
    @PostMapping("/units") @PreAuthorize("hasAuthority('ROLE_ADMIN')") public Unit createUnit(@Valid @RequestBody MasterDataDtos.UnitRequest request) { return masterDataService.createUnit(request); }

    @GetMapping("/suppliers") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public List<Supplier> suppliers() { return masterDataService.getSuppliers(); }
    @PostMapping("/suppliers") @PreAuthorize("hasAuthority('ROLE_ADMIN')") public Supplier createSupplier(@Valid @RequestBody MasterDataDtos.SupplierRequest request) { return masterDataService.createSupplier(request); }

    @GetMapping("/products") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE','ROLE_REQUESTER')") public List<Product> products(@RequestParam(required = false) String term) { return masterDataService.getProducts(term); }
    @PostMapping("/products") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public Product createProduct(@Valid @RequestBody MasterDataDtos.ProductRequest request) { return masterDataService.createProduct(request); }
    @PutMapping("/products/{id}") @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_WAREHOUSE')") public Product updateProduct(@PathVariable Long id, @Valid @RequestBody MasterDataDtos.ProductRequest request) { return masterDataService.updateProduct(id, request); }
    @PatchMapping("/products/{id}/deactivate") @PreAuthorize("hasAuthority('ROLE_ADMIN')") public Product deactivateProduct(@PathVariable Long id) { return masterDataService.deactivateProduct(id); }
}
