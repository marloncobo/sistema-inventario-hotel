package com.hotel.inventory.service;

import com.hotel.inventory.client.RoomClient;
import com.hotel.inventory.dto.CreateSupplyItemRequest;
import com.hotel.inventory.dto.InternalStockDecreaseRequest;
import com.hotel.inventory.dto.InventorySummaryReport;
import com.hotel.inventory.dto.RoomValidationResponse;
import com.hotel.inventory.dto.StockChangeResponse;
import com.hotel.inventory.dto.StockEntryRequest;
import com.hotel.inventory.dto.StockReturnRequest;
import com.hotel.inventory.dto.TopUsedItemReport;
import com.hotel.inventory.dto.UpdateSupplyItemRequest;
import com.hotel.inventory.dto.VoidMovementRequest;
import com.hotel.inventory.exception.BusinessException;
import com.hotel.inventory.exception.NotFoundException;
import com.hotel.inventory.model.Area;
import com.hotel.inventory.model.Category;
import com.hotel.inventory.model.InventoryMovement;
import com.hotel.inventory.model.LowStockAlert;
import com.hotel.inventory.model.Provider;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.model.UnitOfMeasure;
import com.hotel.inventory.repository.InventoryMovementRepository;
import com.hotel.inventory.repository.SupplyItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class InventoryService {
    private static final LocalDateTime MIN_DATE = LocalDateTime.of(1900, 1, 1, 0, 0);
    private static final LocalDateTime MAX_DATE = LocalDateTime.of(9999, 12, 31, 23, 59, 59);
    private static final Pattern TRAILING_NUMBER_PATTERN = Pattern.compile("(\\d+)$");
    private static final String ITEM_CODE_PREFIX = "INS-";

    private final SupplyItemRepository supplyItemRepository;
    private final InventoryMovementRepository movementRepository;
    private final CatalogService catalogService;
    private final AuditService auditService;
    private final LowStockAlertService lowStockAlertService;
    private final RoomClient roomClient;

    public InventoryService(SupplyItemRepository supplyItemRepository, InventoryMovementRepository movementRepository,
                            CatalogService catalogService, AuditService auditService,
                            LowStockAlertService lowStockAlertService, RoomClient roomClient) {
        this.supplyItemRepository = supplyItemRepository;
        this.movementRepository = movementRepository;
        this.catalogService = catalogService;
        this.auditService = auditService;
        this.lowStockAlertService = lowStockAlertService;
        this.roomClient = roomClient;
    }

    @Transactional
    public SupplyItem createItem(CreateSupplyItemRequest request, String username) {
        String generatedCode = generateNextItemCode();
        validateUniqueItem(generatedCode, request.name(), null);
        CatalogSelection catalogs = validateCatalogs(request.category(), request.unit(), request.providerName());
        validateStockBounds(request.stock(), request.minStock(), request.maxStock());

        SupplyItem item = new SupplyItem(
                generatedCode, request.name(), request.description(), catalogs.category(),
                catalogs.unit(), catalogs.provider(), request.stock(), request.minStock(),
                request.maxStock(), true
        );
        SupplyItem saved = supplyItemRepository.save(item);
        if (saved.getStock() > 0) {
            movementRepository.save(buildMovement(saved, "ENTRADA", "NO_APLICA", saved.getStock(), 0,
                    saved.getStock(), null, null, saved.getProviderEntity(), username, "Carga inicial"));
        }
        auditService.record("CREATE", "SupplyItem", saved.getId(), username, saved.getCode());
        lowStockAlertService.evaluate(saved);
        return saved;
    }

    public List<SupplyItem> listItems() {
        return supplyItemRepository.findAll();
    }

    public List<SupplyItem> listItemsByCategory(String category) {
        return supplyItemRepository.findByCategory(blankToNullLower(category));
    }

    public SupplyItem getItem(Long id) {
        return supplyItemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe el insumo con id " + id));
    }

    @Transactional
    public SupplyItem updateItem(Long id, UpdateSupplyItemRequest request, String username) {
        SupplyItem item = getItem(id);
        validateUniqueItem(request.code(), request.name(), id);
        CatalogSelection catalogs = validateCatalogs(request.category(), request.unit(), request.providerName());
        validateStockBounds(item.getStock(), request.minStock(), request.maxStock());

        item.setCode(normalize(request.code()));
        item.setName(request.name());
        item.setDescription(request.description());
        item.setCategory(catalogs.category());
        item.setUnit(catalogs.unit());
        item.setProvider(catalogs.provider());
        item.setMinStock(request.minStock());
        item.setMaxStock(request.maxStock());
        if (request.active() != null) {
            item.setActive(request.active());
        }
        SupplyItem saved = supplyItemRepository.save(item);
        auditService.record("UPDATE", "SupplyItem", saved.getId(), username, saved.getCode());
        lowStockAlertService.evaluate(saved);
        return saved;
    }

    @Transactional
    public SupplyItem deactivateItem(Long id, String username) {
        SupplyItem item = getItem(id);
        item.setActive(false);
        SupplyItem saved = supplyItemRepository.save(item);
        auditService.record("DEACTIVATE", "SupplyItem", saved.getId(), username, saved.getCode());
        return saved;
    }

    @Transactional
    public SupplyItem addStock(Long itemId, StockEntryRequest request, String username) {
        SupplyItem item = getItem(itemId);
        ensureActive(item);
        Provider provider = catalogService.ensureActiveProvider(request.providerName());
        int stockBefore = item.getStock();
        int stockAfter = stockBefore + request.quantity();
        validateStockBounds(stockAfter, item.getMinStock(), item.getMaxStock());

        item.setStock(stockAfter);
        InventoryMovement movement = buildMovement(item, "ENTRADA", "NO_APLICA", request.quantity(), stockBefore,
                stockAfter, null, null, provider, username, request.referenceText());
        movement.setOperationalResponsible(username);
        movementRepository.save(movement);
        SupplyItem saved = supplyItemRepository.save(item);
        auditService.record("STOCK_ENTRY", "SupplyItem", saved.getId(), username, "Cantidad " + request.quantity());
        lowStockAlertService.evaluate(saved);
        return saved;
    }

    @Transactional
    public StockChangeResponse decreaseStock(InternalStockDecreaseRequest request, String username, boolean roomsServiceFlow) {
        SupplyItem item = getItem(request.itemId());
        ensureActive(item);
        if (item.getStock() < request.quantity()) {
            throw new BusinessException("Stock insuficiente para el insumo " + item.getName());
        }

        String origin = normalize(request.origin());
        validateExitOrigin(origin, request.roomNumber(), request.areaName(), request.referenceText());
        if ("HABITACION".equals(origin) && !roomsServiceFlow) {
            throw new BusinessException("Las salidas a habitacion deben registrarse desde rooms-service para conservar la distribucion por habitacion");
        }
        validateRoomDestination(origin, request.roomNumber());
        Area area = null;
        if ("CONSUMO_INTERNO".equals(origin)) {
            area = catalogService.ensureActiveArea(request.areaName());
        }
        int stockBefore = item.getStock();
        int stockAfter = stockBefore - request.quantity();

        item.setStock(stockAfter);
        InventoryMovement movement = buildMovement(item, "SALIDA", origin, request.quantity(), stockBefore, stockAfter,
                request.roomNumber(), area, null, username, request.referenceText());
        movement.setOperationalResponsible(defaultOperationalResponsible(request.operationalResponsible(), username));
        movementRepository.save(movement);
        SupplyItem saved = supplyItemRepository.save(item);
        auditService.record("STOCK_EXIT", "SupplyItem", item.getId(), username, origin + " cantidad " + request.quantity());
        lowStockAlertService.evaluate(saved);
        return new StockChangeResponse(saved.getId(), saved.getName(), saved.getStock(), "Stock descontado correctamente");
    }

    @Transactional
    public StockChangeResponse returnStock(Long itemId, StockReturnRequest request, String username) {
        SupplyItem item = getItem(itemId);
        ensureActive(item);
        InventoryMovement source = validateReturnSource(itemId, request);
        int stockBefore = item.getStock();
        int stockAfter = stockBefore + request.quantity();
        validateStockBounds(stockAfter, item.getMinStock(), item.getMaxStock());

        item.setStock(stockAfter);
        InventoryMovement movement = buildMovement(item, "DEVOLUCION", source == null ? "NO_APLICA" : source.getOrigin(), request.quantity(), stockBefore,
                stockAfter, request.roomNumber(), source == null ? null : source.getAreaEntity(), null, username, request.referenceText());
        movement.setSourceMovement(source);
        movement.setOperationalResponsible(defaultOperationalResponsible(request.operationalResponsible(), username));
        movementRepository.save(movement);
        SupplyItem saved = supplyItemRepository.save(item);
        auditService.record("STOCK_RETURN", "SupplyItem", item.getId(), username, "Origen movimiento " + request.sourceMovementId());
        lowStockAlertService.evaluate(saved);
        return new StockChangeResponse(saved.getId(), saved.getName(), saved.getStock(), "Stock devuelto correctamente");
    }

    public List<InventoryMovement> listMovements(String type, String origin, String roomNumber, String responsible,
                                                 String operationalResponsible,
                                                 String areaName, LocalDate startDate, LocalDate endDate) {
        return movementRepository.search(
                blankToWildcardLower(type),
                blankToWildcardLower(origin),
                blankToWildcardLower(roomNumber),
                blankToWildcardLower(responsible),
                blankToWildcardLower(operationalResponsible),
                blankToWildcardLower(areaName),
                startDate == null ? MIN_DATE : startDate.atStartOfDay(),
                endDate == null ? MAX_DATE : endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
    }

    public List<SupplyItem> lowStockItems() {
        return supplyItemRepository.findLowStockItems();
    }

    public List<LowStockAlert> lowStockAlerts(Boolean openOnly) {
        return lowStockAlertService.list(openOnly);
    }

    @Transactional
    public InventoryMovement voidMovement(Long id, VoidMovementRequest request, String username) {
        InventoryMovement movement = movementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe el movimiento " + id));
        if (!"VALIDO".equals(movement.getStatus())) {
            throw new BusinessException("El movimiento ya fue corregido o anulado");
        }
        if (!List.of("ENTRADA", "SALIDA", "DEVOLUCION").contains(movement.getMovementType())) {
            throw new BusinessException("Este tipo de movimiento no se puede anular");
        }

        SupplyItem item = getItem(movement.getItemId());
        int stockBefore = item.getStock();
        int delta = switch (movement.getMovementType()) {
            case "ENTRADA", "DEVOLUCION" -> -movement.getQuantity();
            case "SALIDA" -> movement.getQuantity();
            default -> 0;
        };
        int stockAfter = stockBefore + delta;
        validateStockBounds(stockAfter, item.getMinStock(), item.getMaxStock());

        item.setStock(stockAfter);
        SupplyItem savedItem = supplyItemRepository.save(item);
        InventoryMovement correction = buildMovement(savedItem, "AJUSTE", "CORRECCION", Math.abs(delta), stockBefore,
                stockAfter, movement.getRoomNumber(), movement.getAreaEntity(), movement.getProviderEntity(), username,
                "Anula movimiento " + id + ": " + request.reason());
        correction.setSourceMovement(movement);
        correction.setOperationalResponsible(username);
        InventoryMovement savedCorrection = movementRepository.save(correction);

        movement.setStatus("ANULADO");
        movement.setCorrectionReason(request.reason());
        movement.setCorrectionMovement(savedCorrection);
        movementRepository.save(movement);
        auditService.record("VOID_MOVEMENT", "InventoryMovement", id, username, request.reason());
        lowStockAlertService.evaluate(savedItem);
        return movement;
    }

    public List<InventorySummaryReport> inventoryReport(LocalDate startDate, LocalDate endDate) {
        List<TopUsedItemReport> used = movementRepository.topUsedItems(
                startDate == null ? MIN_DATE : startDate.atStartOfDay(),
                endDate == null ? MAX_DATE : endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
        return supplyItemRepository.findAll().stream()
                .map(item -> new InventorySummaryReport(
                        item.getId(), item.getCode(), item.getName(), item.getCategory(), item.getUnit(),
                        item.getStock(), item.getMinStock(), item.getMaxStock(), item.getStock() <= item.getMinStock(),
                        BigDecimal.valueOf(used.stream()
                                .filter(row -> row.itemId().equals(item.getId()))
                                .findFirst()
                                .map(TopUsedItemReport::totalQuantity)
                                .orElse(0L))
                ))
                .toList();
    }

    public List<TopUsedItemReport> topUsedItems(LocalDate startDate, LocalDate endDate) {
        return movementRepository.topUsedItems(
                startDate == null ? MIN_DATE : startDate.atStartOfDay(),
                endDate == null ? MAX_DATE : endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
    }

    private InventoryMovement buildMovement(SupplyItem item, String type, String origin, Integer quantity,
                                            Integer stockBefore, Integer stockAfter, String roomNumber,
                                            Area area, Provider provider, String responsible,
                                            String referenceText) {
        InventoryMovement movement = new InventoryMovement(item, type, origin, quantity, stockBefore, stockAfter,
                roomNumber, area, provider, responsible, referenceText, "VALIDO", LocalDateTime.now());
        movement.setArea(area);
        return movement;
    }

    private void validateUniqueItem(String code, String name, Long currentId) {
        if (currentId == null) {
            if (supplyItemRepository.existsByCodeIgnoreCase(code)) {
                throw new BusinessException("Ya existe un insumo con codigo " + code);
            }
            if (supplyItemRepository.existsByNameIgnoreCase(name)) {
                throw new BusinessException("Ya existe un insumo con nombre " + name);
            }
            return;
        }
        if (supplyItemRepository.existsByCodeIgnoreCaseAndIdNot(code, currentId)) {
            throw new BusinessException("Ya existe un insumo con codigo " + code);
        }
        if (supplyItemRepository.existsByNameIgnoreCaseAndIdNot(name, currentId)) {
            throw new BusinessException("Ya existe un insumo con nombre " + name);
        }
    }

    private void validateStockBounds(Integer stock, Integer minStock, Integer maxStock) {
        if (stock < 0 || minStock < 0) {
            throw new BusinessException("El stock y el stock minimo no pueden ser negativos");
        }
        if (maxStock != null && maxStock < minStock) {
            throw new BusinessException("El stock maximo debe ser mayor o igual al stock minimo");
        }
        if (maxStock != null && stock > maxStock) {
            throw new BusinessException("El stock no puede superar el stock maximo configurado");
        }
    }

    private void ensureActive(SupplyItem item) {
        if (!Boolean.TRUE.equals(item.getActive())) {
            throw new BusinessException("No se permiten movimientos con insumos inactivos");
        }
    }

    private void validateExitOrigin(String origin, String roomNumber, String areaName, String referenceText) {
        if (!List.of("HABITACION", "VENTA", "CONSUMO_INTERNO", "MERMA").contains(origin)) {
            throw new BusinessException("Origen de salida no valido: " + origin);
        }
        if ("HABITACION".equals(origin) && isBlank(roomNumber)) {
            throw new BusinessException("Las salidas a habitacion deben indicar una habitacion");
        }
        if ("CONSUMO_INTERNO".equals(origin) && isBlank(areaName)) {
            throw new BusinessException("Las salidas por consumo interno deben indicar un area");
        }
        if (List.of("VENTA", "MERMA").contains(origin) && isBlank(referenceText)) {
            throw new BusinessException("Las salidas por " + origin + " deben indicar una referencia o motivo");
        }
    }

    private void validateRoomDestination(String origin, String roomNumber) {
        if (!"HABITACION".equals(origin)) {
            return;
        }
        try {
            RoomValidationResponse room = roomClient.getRoomByNumber(roomNumber);
            if (room == null || !Boolean.TRUE.equals(room.active())) {
                throw new BusinessException("La habitacion " + roomNumber + " esta inactiva o no existe");
            }
            if (List.of("FUERA_DE_SERVICIO", "MANTENIMIENTO").contains(normalize(room.status()))) {
                throw new BusinessException("La habitacion " + roomNumber + " no esta habilitada para recibir insumos");
            }
        } catch (BusinessException ex) {
            throw ex;
        } catch (RestClientException ex) {
            throw new BusinessException("No fue posible validar la habitacion " + roomNumber + ": " + ex.getMessage());
        }
    }

    private InventoryMovement validateReturnSource(Long itemId, StockReturnRequest request) {
        if (request.sourceMovementId() == null) {
            throw new BusinessException("La devolucion debe indicar el movimiento origen");
        }
        InventoryMovement source = movementRepository.findById(request.sourceMovementId())
                .orElseThrow(() -> new NotFoundException("No existe el movimiento origen " + request.sourceMovementId()));
        if (!"SALIDA".equals(source.getMovementType()) || !"VALIDO".equals(source.getStatus())) {
            throw new BusinessException("Solo se pueden devolver salidas validas");
        }
        if (!source.getItemId().equals(itemId)) {
            throw new BusinessException("La devolucion no corresponde al mismo insumo del movimiento origen");
        }
        if (!isBlank(request.roomNumber()) && source.getRoomNumber() != null && !request.roomNumber().equals(source.getRoomNumber())) {
            throw new BusinessException("La habitacion de la devolucion no coincide con el movimiento origen");
        }
        if (!isBlank(request.areaName()) && source.getAreaName() != null && !normalize(request.areaName()).equals(normalize(source.getAreaName()))) {
            throw new BusinessException("El area de la devolucion no coincide con el movimiento origen");
        }
        long alreadyReturned = movementRepository.returnedQuantityFor(source.getId());
        if (alreadyReturned + request.quantity() > source.getQuantity()) {
            throw new BusinessException("La devolucion supera la cantidad pendiente del movimiento origen");
        }
        return source;
    }

    private CatalogSelection validateCatalogs(String category, String unit, String providerName) {
        if (isBlank(category) || isBlank(unit)) {
            throw new BusinessException("Categoria y unidad son obligatorias");
        }
        Category foundCategory = catalogService.ensureActiveCategory(category);
        UnitOfMeasure foundUnit = catalogService.ensureActiveUnit(unit);
        Provider foundProvider = catalogService.ensureActiveProvider(providerName);
        return new CatalogSelection(foundCategory, foundUnit, foundProvider);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String blankToNullLower(String value) {
        return isBlank(value) ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private String blankToWildcardLower(String value) {
        return isBlank(value) ? "%" : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String defaultOperationalResponsible(String value, String username) {
        return isBlank(value) ? username : value.trim();
    }

    private String generateNextItemCode() {
        int nextSequence = supplyItemRepository.findAllCodes().stream()
                .map(this::extractTrailingNumber)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0) + 1;
        return ITEM_CODE_PREFIX + String.format("%04d", nextSequence);
    }

    private int extractTrailingNumber(String code) {
        if (isBlank(code)) {
            return 0;
        }
        Matcher matcher = TRAILING_NUMBER_PATTERN.matcher(code.trim());
        if (!matcher.find()) {
            return 0;
        }
        return Integer.parseInt(matcher.group(1));
    }

    private record CatalogSelection(Category category, UnitOfMeasure unit, Provider provider) {}
}
