package com.lunara.masterdata.service;

import com.lunara.masterdata.dto.MasterDataDtos;
import com.lunara.masterdata.exception.BusinessException;
import com.lunara.masterdata.model.*;
import com.lunara.masterdata.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MasterDataService {
    private final AreaRepository areaRepository;
    private final WarehouseRepository warehouseRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    public MasterDataService(AreaRepository areaRepository, WarehouseRepository warehouseRepository, CategoryRepository categoryRepository, UnitRepository unitRepository, SupplierRepository supplierRepository, ProductRepository productRepository) {
        this.areaRepository = areaRepository;
        this.warehouseRepository = warehouseRepository;
        this.categoryRepository = categoryRepository;
        this.unitRepository = unitRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
    }
    public List<Area> getAreas() { return areaRepository.findAll(); }
    public List<Warehouse> getWarehouses() { return warehouseRepository.findAll(); }
    public List<Category> getCategories() { return categoryRepository.findAll(); }
    public List<Unit> getUnits() { return unitRepository.findAll(); }
    public List<Supplier> getSuppliers() { return supplierRepository.findAll(); }
    public List<Product> getProducts(String term) { return term == null || term.trim().isEmpty() ? productRepository.findAll() : productRepository.findByNameContainingIgnoreCase(term.trim()); }
    @Transactional public Area createArea(MasterDataDtos.AreaRequest request) {
        if (areaRepository.existsByNameIgnoreCase(request.getName())) throw new BusinessException("El área ya existe");
        Area area = new Area(); area.setName(request.getName().trim()); area.setDescription(request.getDescription().trim()); area.setResponsible(request.getResponsible().trim()); return areaRepository.save(area);
    }
    @Transactional public Warehouse createWarehouse(MasterDataDtos.WarehouseRequest request) {
        if (warehouseRepository.existsByNameIgnoreCase(request.getName())) throw new BusinessException("La bodega ya existe");
        Warehouse warehouse = new Warehouse(); warehouse.setName(request.getName().trim()); warehouse.setLocation(request.getLocation().trim()); warehouse.setDescription(request.getDescription().trim()); warehouse.setStatus(request.getStatus()); return warehouseRepository.save(warehouse);
    }
    @Transactional public Category createCategory(MasterDataDtos.CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName())) throw new BusinessException("La categoría ya existe");
        Category category = new Category(); category.setName(request.getName().trim()); category.setDescription(request.getDescription().trim()); return categoryRepository.save(category);
    }
    @Transactional public Unit createUnit(MasterDataDtos.UnitRequest request) {
        if (unitRepository.existsByAbbreviationIgnoreCase(request.getAbbreviation())) throw new BusinessException("La abreviatura ya existe");
        Unit unit = new Unit(); unit.setName(request.getName().trim()); unit.setAbbreviation(request.getAbbreviation().trim().toLowerCase()); return unitRepository.save(unit);
    }
    @Transactional public Supplier createSupplier(MasterDataDtos.SupplierRequest request) {
        if (supplierRepository.existsByTaxIdIgnoreCase(request.getTaxId())) throw new BusinessException("El proveedor ya existe");
        Supplier supplier = new Supplier(); supplier.setName(request.getName().trim()); supplier.setTaxId(request.getTaxId().trim()); supplier.setPhone(request.getPhone()); supplier.setEmail(request.getEmail()); supplier.setAddress(request.getAddress()); supplier.setCity(request.getCity()); supplier.setStatus(request.getStatus()); return supplierRepository.save(supplier);
    }
    @Transactional public Product createProduct(MasterDataDtos.ProductRequest request) {
        if (productRepository.existsByCodeIgnoreCase(request.getCode())) throw new BusinessException("El código del producto ya existe");
        validateStockRange(request);
        Product product = new Product(); applyProduct(product, request); return productRepository.save(product);
    }
    @Transactional public Product updateProduct(Long id, MasterDataDtos.ProductRequest request) {
        Product product = productRepository.findById(id).orElseThrow(() -> new BusinessException("Producto no encontrado"));
        if (!product.getCode().equalsIgnoreCase(request.getCode()) && productRepository.existsByCodeIgnoreCase(request.getCode())) throw new BusinessException("El código del producto ya existe");
        validateStockRange(request); applyProduct(product, request); return productRepository.save(product);
    }
    @Transactional public Product deactivateProduct(Long id) {
        Product product = productRepository.findById(id).orElseThrow(() -> new BusinessException("Producto no encontrado"));
        product.setStatus(RecordStatus.INACTIVE); return productRepository.save(product);
    }
    private void validateStockRange(MasterDataDtos.ProductRequest request) {
        if (request.getMaximumStock() != null && request.getMaximumStock().compareTo(request.getMinimumStock()) < 0) throw new BusinessException("El stock máximo debe ser mayor o igual al mínimo");
    }
    private void applyProduct(Product product, MasterDataDtos.ProductRequest request) {
        product.setCode(request.getCode().trim().toUpperCase());
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription().trim());
        product.setCategory(categoryRepository.findById(request.getCategoryId()).orElseThrow(() -> new BusinessException("Categoría no encontrada")));
        product.setUnit(unitRepository.findById(request.getUnitId()).orElseThrow(() -> new BusinessException("Unidad no encontrada")));
        product.setSupplier(request.getSupplierId() == null ? null : supplierRepository.findById(request.getSupplierId()).orElseThrow(() -> new BusinessException("Proveedor no encontrado")));
        product.setMinimumStock(request.getMinimumStock());
        product.setMaximumStock(request.getMaximumStock());
        product.setAverageCost(request.getAverageCost());
        product.setPerishable(request.isPerishable());
        product.setLotControl(request.isLotControl());
        product.setExpirationControl(request.isExpirationControl());
        product.setStatus(request.getStatus());
    }
}
