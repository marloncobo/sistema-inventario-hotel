package com.hotel.inventory.service;

import com.hotel.inventory.dto.CatalogRequest;
import com.hotel.inventory.exception.BusinessException;
import com.hotel.inventory.exception.NotFoundException;
import com.hotel.inventory.model.Area;
import com.hotel.inventory.model.Category;
import com.hotel.inventory.model.Provider;
import com.hotel.inventory.model.UnitOfMeasure;
import com.hotel.inventory.repository.AreaRepository;
import com.hotel.inventory.repository.CategoryRepository;
import com.hotel.inventory.repository.ProviderRepository;
import com.hotel.inventory.repository.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class CatalogService {
    private final CategoryRepository categoryRepository;
    private final UnitOfMeasureRepository unitRepository;
    private final ProviderRepository providerRepository;
    private final AreaRepository areaRepository;
    private final AuditService auditService;

    public CatalogService(CategoryRepository categoryRepository, UnitOfMeasureRepository unitRepository,
                          ProviderRepository providerRepository, AreaRepository areaRepository,
                          AuditService auditService) {
        this.categoryRepository = categoryRepository;
        this.unitRepository = unitRepository;
        this.providerRepository = providerRepository;
        this.areaRepository = areaRepository;
        this.auditService = auditService;
    }

    public List<Category> categories() { return categoryRepository.findAll(); }
    public List<UnitOfMeasure> units() { return unitRepository.findAll(); }
    public List<Provider> providers() { return providerRepository.findAll(); }
    public List<Area> areas() { return areaRepository.findAll(); }

    @Transactional
    public Category createCategory(CatalogRequest request, String username) {
        validateCategoryUnique(request.code(), request.name(), null);
        Category saved = categoryRepository.save(new Category(normalize(request.code()), normalize(request.name()), active(request.active())));
        auditService.record("CREATE", "Category", saved.getId(), username, saved.getCode());
        return saved;
    }

    @Transactional
    public Category updateCategory(Long id, CatalogRequest request, String username) {
        Category category = categoryRepository.findById(id).orElseThrow(() -> new NotFoundException("No existe la categoria " + id));
        validateCategoryUnique(request.code(), request.name(), id);
        category.setCode(normalize(request.code()));
        category.setName(normalize(request.name()));
        category.setActive(active(request.active()));
        auditService.record("UPDATE", "Category", id, username, category.getCode());
        return categoryRepository.save(category);
    }

    @Transactional
    public UnitOfMeasure createUnit(CatalogRequest request, String username) {
        validateUnitUnique(request.code(), request.name(), request.abbreviation(), null);
        UnitOfMeasure saved = unitRepository.save(new UnitOfMeasure(normalize(request.code()), normalize(request.name()), normalize(request.abbreviation()), active(request.active())));
        auditService.record("CREATE", "UnitOfMeasure", saved.getId(), username, saved.getCode());
        return saved;
    }

    @Transactional
    public UnitOfMeasure updateUnit(Long id, CatalogRequest request, String username) {
        UnitOfMeasure unit = unitRepository.findById(id).orElseThrow(() -> new NotFoundException("No existe la unidad " + id));
        validateUnitUnique(request.code(), request.name(), request.abbreviation(), id);
        unit.setCode(normalize(request.code()));
        unit.setName(normalize(request.name()));
        unit.setAbbreviation(normalize(request.abbreviation()));
        unit.setActive(active(request.active()));
        auditService.record("UPDATE", "UnitOfMeasure", id, username, unit.getCode());
        return unitRepository.save(unit);
    }

    @Transactional
    public Provider createProvider(CatalogRequest request, String username) {
        validateProviderUnique(request.documentNumber(), request.name(), null);
        Provider saved = providerRepository.save(new Provider(normalize(request.documentNumber()), request.name(), request.phone(), request.email(), active(request.active())));
        auditService.record("CREATE", "Provider", saved.getId(), username, saved.getName());
        return saved;
    }

    @Transactional
    public Provider updateProvider(Long id, CatalogRequest request, String username) {
        Provider provider = providerRepository.findById(id).orElseThrow(() -> new NotFoundException("No existe el proveedor " + id));
        validateProviderUnique(request.documentNumber(), request.name(), id);
        provider.setDocumentNumber(normalize(request.documentNumber()));
        provider.setName(request.name());
        provider.setPhone(request.phone());
        provider.setEmail(request.email());
        provider.setActive(active(request.active()));
        auditService.record("UPDATE", "Provider", id, username, provider.getName());
        return providerRepository.save(provider);
    }

    @Transactional
    public Area createArea(CatalogRequest request, String username) {
        validateAreaUnique(request.code(), request.name(), null);
        Area saved = areaRepository.save(new Area(normalize(request.code()), normalize(request.name()), active(request.active())));
        auditService.record("CREATE", "Area", saved.getId(), username, saved.getCode());
        return saved;
    }

    @Transactional
    public Area updateArea(Long id, CatalogRequest request, String username) {
        Area area = areaRepository.findById(id).orElseThrow(() -> new NotFoundException("No existe el area " + id));
        validateAreaUnique(request.code(), request.name(), id);
        area.setCode(normalize(request.code()));
        area.setName(normalize(request.name()));
        area.setActive(active(request.active()));
        auditService.record("UPDATE", "Area", id, username, area.getCode());
        return areaRepository.save(area);
    }

    public void ensureActiveCategory(String category) {
        Category found = categoryRepository.findByCodeIgnoreCase(normalize(category))
                .or(() -> categoryRepository.findByNameIgnoreCase(normalize(category)))
                .orElseThrow(() -> new BusinessException("La categoria no existe en el catalogo: " + category));
        if (!Boolean.TRUE.equals(found.getActive())) {
            throw new BusinessException("La categoria esta inactiva: " + category);
        }
    }

    public void ensureActiveUnit(String unit) {
        UnitOfMeasure found = unitRepository.findByCodeIgnoreCase(normalize(unit))
                .or(() -> unitRepository.findByAbbreviationIgnoreCase(normalize(unit)))
                .orElseThrow(() -> new BusinessException("La unidad no existe en el catalogo: " + unit));
        if (!Boolean.TRUE.equals(found.getActive())) {
            throw new BusinessException("La unidad esta inactiva: " + unit);
        }
    }

    public void ensureActiveProvider(String providerName) {
        if (providerName == null || providerName.isBlank()) {
            return;
        }
        Provider found = providerRepository.findByNameIgnoreCase(providerName)
                .orElseThrow(() -> new BusinessException("El proveedor no existe en el catalogo: " + providerName));
        if (!Boolean.TRUE.equals(found.getActive())) {
            throw new BusinessException("El proveedor esta inactivo: " + providerName);
        }
    }

    public void ensureActiveArea(String areaName) {
        Area found = areaRepository.findByNameIgnoreCase(normalize(areaName))
                .orElseThrow(() -> new BusinessException("El area no existe en el catalogo: " + areaName));
        if (!Boolean.TRUE.equals(found.getActive())) {
            throw new BusinessException("El area esta inactiva: " + areaName);
        }
    }

    private void validateCategoryUnique(String code, String name, Long id) {
        if ((id == null && categoryRepository.existsByCodeIgnoreCase(code)) || (id != null && categoryRepository.existsByCodeIgnoreCaseAndIdNot(code, id))) throw new BusinessException("Ya existe la categoria con codigo " + code);
        if ((id == null && categoryRepository.existsByNameIgnoreCase(name)) || (id != null && categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id))) throw new BusinessException("Ya existe la categoria con nombre " + name);
    }

    private void validateUnitUnique(String code, String name, String abbreviation, Long id) {
        if (abbreviation == null || abbreviation.isBlank()) throw new BusinessException("La abreviatura de unidad es obligatoria");
        if ((id == null && unitRepository.existsByCodeIgnoreCase(code)) || (id != null && unitRepository.existsByCodeIgnoreCaseAndIdNot(code, id))) throw new BusinessException("Ya existe la unidad con codigo " + code);
        if ((id == null && unitRepository.existsByNameIgnoreCase(name)) || (id != null && unitRepository.existsByNameIgnoreCaseAndIdNot(name, id))) throw new BusinessException("Ya existe la unidad con nombre " + name);
        if ((id == null && unitRepository.existsByAbbreviationIgnoreCase(abbreviation)) || (id != null && unitRepository.existsByAbbreviationIgnoreCaseAndIdNot(abbreviation, id))) throw new BusinessException("Ya existe la abreviatura " + abbreviation);
    }

    private void validateProviderUnique(String documentNumber, String name, Long id) {
        if (documentNumber == null || documentNumber.isBlank()) throw new BusinessException("El documento del proveedor es obligatorio");
        if (!documentNumber.matches("[A-Za-z0-9.-]{5,40}")) throw new BusinessException("El documento del proveedor debe tener entre 5 y 40 caracteres validos");
        if ((id == null && providerRepository.existsByDocumentNumberIgnoreCase(documentNumber)) || (id != null && providerRepository.existsByDocumentNumberIgnoreCaseAndIdNot(documentNumber, id))) throw new BusinessException("Ya existe el proveedor con documento " + documentNumber);
        if ((id == null && providerRepository.existsByNameIgnoreCase(name)) || (id != null && providerRepository.existsByNameIgnoreCaseAndIdNot(name, id))) throw new BusinessException("Ya existe el proveedor con nombre " + name);
    }

    private void validateAreaUnique(String code, String name, Long id) {
        if ((id == null && areaRepository.existsByCodeIgnoreCase(code)) || (id != null && areaRepository.existsByCodeIgnoreCaseAndIdNot(code, id))) throw new BusinessException("Ya existe el area con codigo " + code);
        if ((id == null && areaRepository.existsByNameIgnoreCase(name)) || (id != null && areaRepository.existsByNameIgnoreCaseAndIdNot(name, id))) throw new BusinessException("Ya existe el area con nombre " + name);
    }

    private Boolean active(Boolean active) {
        return active == null || active;
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
    }
}
