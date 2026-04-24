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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CatalogService {
    private static final String CATEGORY_CODE_PREFIX = "CAT-";
    private static final Pattern CATEGORY_CODE_PATTERN = Pattern.compile("^" + CATEGORY_CODE_PREFIX + "(\\d+)$");
    private static final String UNIT_CODE_PREFIX = "UNI-";
    private static final Pattern UNIT_CODE_PATTERN = Pattern.compile("^" + UNIT_CODE_PREFIX + "(\\d+)$");
    private static final String PROVIDER_CODE_PREFIX = "PRO-";
    private static final Pattern PROVIDER_CODE_PATTERN = Pattern.compile("^" + PROVIDER_CODE_PREFIX + "(\\d+)$");
    private static final String AREA_CODE_PREFIX = "ARE-";
    private static final Pattern AREA_CODE_PATTERN = Pattern.compile("^" + AREA_CODE_PREFIX + "(\\d+)$");

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
        String generatedCode = generateNextCategoryCode();
        validateCategoryUnique(generatedCode, request.name(), null);
        Category saved = categoryRepository.save(new Category(generatedCode, normalize(request.name()), active(request.active())));
        auditService.record("CREATE", "Category", saved.getId(), username, saved.getCode());
        return saved;
    }

    @Transactional
    public Category updateCategory(Long id, CatalogRequest request, String username) {
        Category category = categoryRepository.findById(id).orElseThrow(() -> new NotFoundException("No existe la categoria " + id));
        String code = requiredCode(request.code(), "La categoria debe indicar un codigo");
        validateCategoryUnique(request.code(), request.name(), id);
        category.setCode(normalize(code));
        category.setName(normalize(request.name()));
        category.setActive(active(request.active()));
        auditService.record("UPDATE", "Category", id, username, category.getCode());
        return categoryRepository.save(category);
    }

    @Transactional
    public UnitOfMeasure createUnit(CatalogRequest request, String username) {
        String generatedCode = generateNextUnitCode();
        validateUnitUnique(generatedCode, request.name(), request.abbreviation(), null);
        UnitOfMeasure saved = unitRepository.save(new UnitOfMeasure(generatedCode, normalize(request.name()), normalize(request.abbreviation()), active(request.active())));
        auditService.record("CREATE", "UnitOfMeasure", saved.getId(), username, saved.getCode());
        return saved;
    }

    @Transactional
    public UnitOfMeasure updateUnit(Long id, CatalogRequest request, String username) {
        UnitOfMeasure unit = unitRepository.findById(id).orElseThrow(() -> new NotFoundException("No existe la unidad " + id));
        String code = requiredCode(request.code(), "La unidad debe indicar un codigo");
        validateUnitUnique(request.code(), request.name(), request.abbreviation(), id);
        unit.setCode(normalize(code));
        unit.setName(normalize(request.name()));
        unit.setAbbreviation(normalize(request.abbreviation()));
        unit.setActive(active(request.active()));
        auditService.record("UPDATE", "UnitOfMeasure", id, username, unit.getCode());
        return unitRepository.save(unit);
    }

    @Transactional
    public Provider createProvider(CatalogRequest request, String username) {
        String generatedCode = generateNextProviderCode();
        validateProviderUnique(generatedCode, request.documentNumber(), request.name(), null);
        Provider saved = providerRepository.save(new Provider(
                generatedCode,
                normalize(request.documentNumber()),
                request.name(),
                request.phone(),
                request.email(),
                active(request.active())
        ));
        auditService.record("CREATE", "Provider", saved.getId(), username, saved.getCode());
        return saved;
    }

    @Transactional
    public Provider updateProvider(Long id, CatalogRequest request, String username) {
        Provider provider = providerRepository.findById(id).orElseThrow(() -> new NotFoundException("No existe el proveedor " + id));
        String code = requiredCode(request.code(), "El proveedor debe indicar un codigo");
        validateProviderUnique(code, request.documentNumber(), request.name(), id);
        provider.setCode(normalize(code));
        provider.setDocumentNumber(normalize(request.documentNumber()));
        provider.setName(request.name());
        provider.setPhone(request.phone());
        provider.setEmail(request.email());
        provider.setActive(active(request.active()));
        auditService.record("UPDATE", "Provider", id, username, provider.getCode());
        return providerRepository.save(provider);
    }

    @Transactional
    public Area createArea(CatalogRequest request, String username) {
        String generatedCode = generateNextAreaCode();
        validateAreaUnique(generatedCode, request.name(), null);
        Area saved = areaRepository.save(new Area(generatedCode, normalize(request.name()), active(request.active())));
        auditService.record("CREATE", "Area", saved.getId(), username, saved.getCode());
        return saved;
    }

    @Transactional
    public Area updateArea(Long id, CatalogRequest request, String username) {
        Area area = areaRepository.findById(id).orElseThrow(() -> new NotFoundException("No existe el area " + id));
        String code = requiredCode(request.code(), "El area debe indicar un codigo");
        validateAreaUnique(request.code(), request.name(), id);
        area.setCode(normalize(code));
        area.setName(normalize(request.name()));
        area.setActive(active(request.active()));
        auditService.record("UPDATE", "Area", id, username, area.getCode());
        return areaRepository.save(area);
    }

    public Category ensureActiveCategory(String category) {
        Category found = categoryRepository.findByCodeIgnoreCase(normalize(category))
                .or(() -> categoryRepository.findByNameIgnoreCase(normalize(category)))
                .orElseThrow(() -> new BusinessException("La categoria no existe en el catalogo: " + category));
        if (!Boolean.TRUE.equals(found.getActive())) {
            throw new BusinessException("La categoria esta inactiva: " + category);
        }
        return found;
    }

    public UnitOfMeasure ensureActiveUnit(String unit) {
        UnitOfMeasure found = unitRepository.findByCodeIgnoreCase(normalize(unit))
                .or(() -> unitRepository.findByAbbreviationIgnoreCase(normalize(unit)))
                .orElseThrow(() -> new BusinessException("La unidad no existe en el catalogo: " + unit));
        if (!Boolean.TRUE.equals(found.getActive())) {
            throw new BusinessException("La unidad esta inactiva: " + unit);
        }
        return found;
    }

    public Provider ensureActiveProvider(String providerName) {
        if (providerName == null || providerName.isBlank()) {
            return null;
        }
        Provider found = providerRepository.findByNameIgnoreCase(providerName)
                .orElseThrow(() -> new BusinessException("El proveedor no existe en el catalogo: " + providerName));
        if (!Boolean.TRUE.equals(found.getActive())) {
            throw new BusinessException("El proveedor esta inactivo: " + providerName);
        }
        return found;
    }

    public Area ensureActiveArea(String areaName) {
        Area found = areaRepository.findByNameIgnoreCase(normalize(areaName))
                .orElseThrow(() -> new BusinessException("El area no existe en el catalogo: " + areaName));
        if (!Boolean.TRUE.equals(found.getActive())) {
            throw new BusinessException("El area esta inactiva: " + areaName);
        }
        return found;
    }

    private void validateCategoryUnique(String code, String name, Long id) {
        code = normalize(code);
        name = normalize(name);
        if ((id == null && categoryRepository.existsByCodeIgnoreCase(code)) || (id != null && categoryRepository.existsByCodeIgnoreCaseAndIdNot(code, id))) throw new BusinessException("Ya existe la categoria con codigo " + code);
        if ((id == null && categoryRepository.existsByNameIgnoreCase(name)) || (id != null && categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id))) throw new BusinessException("Ya existe la categoria con nombre " + name);
    }

    private void validateUnitUnique(String code, String name, String abbreviation, Long id) {
        code = normalize(code);
        name = normalize(name);
        abbreviation = normalize(abbreviation);
        if (abbreviation == null || abbreviation.isBlank()) throw new BusinessException("La abreviatura de unidad es obligatoria");
        if ((id == null && unitRepository.existsByCodeIgnoreCase(code)) || (id != null && unitRepository.existsByCodeIgnoreCaseAndIdNot(code, id))) throw new BusinessException("Ya existe la unidad con codigo " + code);
        if ((id == null && unitRepository.existsByNameIgnoreCase(name)) || (id != null && unitRepository.existsByNameIgnoreCaseAndIdNot(name, id))) throw new BusinessException("Ya existe la unidad con nombre " + name);
        if ((id == null && unitRepository.existsByAbbreviationIgnoreCase(abbreviation)) || (id != null && unitRepository.existsByAbbreviationIgnoreCaseAndIdNot(abbreviation, id))) throw new BusinessException("Ya existe la abreviatura " + abbreviation);
    }

    private void validateProviderUnique(String code, String documentNumber, String name, Long id) {
        code = normalize(code);
        documentNumber = normalize(documentNumber);
        name = normalize(name);
        if (documentNumber == null || documentNumber.isBlank()) throw new BusinessException("El documento del proveedor es obligatorio");
        if (!documentNumber.matches("[A-Za-z0-9.-]{5,40}")) throw new BusinessException("El documento del proveedor debe tener entre 5 y 40 caracteres validos");
        if ((id == null && providerRepository.existsByCodeIgnoreCase(code)) || (id != null && providerRepository.existsByCodeIgnoreCaseAndIdNot(code, id))) throw new BusinessException("Ya existe el proveedor con codigo " + code);
        if ((id == null && providerRepository.existsByDocumentNumberIgnoreCase(documentNumber)) || (id != null && providerRepository.existsByDocumentNumberIgnoreCaseAndIdNot(documentNumber, id))) throw new BusinessException("Ya existe el proveedor con documento " + documentNumber);
        if ((id == null && providerRepository.existsByNameIgnoreCase(name)) || (id != null && providerRepository.existsByNameIgnoreCaseAndIdNot(name, id))) throw new BusinessException("Ya existe el proveedor con nombre " + name);
    }

    private void validateAreaUnique(String code, String name, Long id) {
        code = normalize(code);
        name = normalize(name);
        if ((id == null && areaRepository.existsByCodeIgnoreCase(code)) || (id != null && areaRepository.existsByCodeIgnoreCaseAndIdNot(code, id))) throw new BusinessException("Ya existe el area con codigo " + code);
        if ((id == null && areaRepository.existsByNameIgnoreCase(name)) || (id != null && areaRepository.existsByNameIgnoreCaseAndIdNot(name, id))) throw new BusinessException("Ya existe el area con nombre " + name);
    }

    private String generateNextCategoryCode() {
        return generateNextCode(categoryRepository.findAllCodes(), CATEGORY_CODE_PREFIX, CATEGORY_CODE_PATTERN);
    }

    private String generateNextUnitCode() {
        return generateNextCode(unitRepository.findAllCodes(), UNIT_CODE_PREFIX, UNIT_CODE_PATTERN);
    }

    private String generateNextProviderCode() {
        return generateNextCode(providerRepository.findAllCodes(), PROVIDER_CODE_PREFIX, PROVIDER_CODE_PATTERN);
    }

    private String generateNextAreaCode() {
        return generateNextCode(areaRepository.findAllCodes(), AREA_CODE_PREFIX, AREA_CODE_PATTERN);
    }

    private String generateNextCode(List<String> existingCodes, String prefix, Pattern pattern) {
        int nextSequence = existingCodes.stream()
                .map(code -> extractTrailingNumber(code, pattern))
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0) + 1;
        return prefix + String.format("%04d", nextSequence);
    }

    private int extractTrailingNumber(String code, Pattern pattern) {
        if (code == null || code.isBlank()) {
            return 0;
        }
        Matcher matcher = pattern.matcher(normalize(code));
        if (!matcher.find()) {
            return 0;
        }
        try {
            return Integer.parseInt(matcher.group(1));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private String requiredCode(String code, String message) {
        String normalized = normalize(code);
        if (normalized == null || normalized.isBlank()) {
            throw new BusinessException(message);
        }
        return normalized;
    }

    private Boolean active(Boolean active) {
        return active == null || active;
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
    }
}
