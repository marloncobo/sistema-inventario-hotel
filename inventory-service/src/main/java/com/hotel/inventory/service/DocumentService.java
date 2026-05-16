package com.hotel.inventory.service;

import com.hotel.inventory.dto.CreateDocumentRequest;
import com.hotel.inventory.dto.InitCountRequest;
import com.hotel.inventory.dto.ReceiveDocumentRequest;
import com.hotel.inventory.dto.RecordCountRequest;
import com.hotel.inventory.exception.BusinessException;
import com.hotel.inventory.exception.NotFoundException;
import com.hotel.inventory.model.InventoryDocument;
import com.hotel.inventory.model.InventoryDocumentLine;
import com.hotel.inventory.model.InventoryMovement;
import com.hotel.inventory.model.Location;
import com.hotel.inventory.model.Provider;
import com.hotel.inventory.model.StockByLocation;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.repository.InventoryDocumentLineRepository;
import com.hotel.inventory.repository.StockByLocationRepository;
import com.hotel.inventory.repository.InventoryDocumentRepository;
import com.hotel.inventory.repository.InventoryMovementRepository;
import com.hotel.inventory.repository.LocationRepository;
import com.hotel.inventory.repository.SupplyItemRepository;
import com.hotel.inventory.util.QuantitySupport;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Gestión de documentos multi-ítem (orden de compra, recepción, transferencia, ajuste).
 *
 * Modelo de estados:
 *   BORRADOR  → APROBADO (orden de compra)
 *   APROBADO  → RECIBIDO (al registrar recepción se generan los movimientos)
 *   BORRADOR  → CANCELADO en cualquier momento previo a la ejecución.
 *
 * Cualquier documento que CAMBIE stock (recepción de OC, transferencia, ajuste)
 * delega la mutación a StockLocationService para mantener locking pesimista y
 * sincronización del caché total.
 */
@Service
public class DocumentService {

    private final InventoryDocumentRepository documentRepo;
    private final InventoryDocumentLineRepository lineRepo;
    private final InventoryMovementRepository movementRepo;
    private final SupplyItemRepository itemRepo;
    private final LocationRepository locationRepo;
    private final CatalogService catalogService;
    private final StockLocationService stockLocationService;
    private final StockByLocationRepository stockByLocationRepository;
    private final AuditService auditService;

    public DocumentService(InventoryDocumentRepository documentRepo,
                           InventoryDocumentLineRepository lineRepo,
                           InventoryMovementRepository movementRepo,
                           SupplyItemRepository itemRepo,
                           LocationRepository locationRepo,
                           StockByLocationRepository stockByLocationRepository,
                           CatalogService catalogService,
                           StockLocationService stockLocationService,
                           AuditService auditService) {
        this.documentRepo = documentRepo;
        this.lineRepo = lineRepo;
        this.movementRepo = movementRepo;
        this.itemRepo = itemRepo;
        this.locationRepo = locationRepo;
        this.stockByLocationRepository = stockByLocationRepository;
        this.catalogService = catalogService;
        this.stockLocationService = stockLocationService;
        this.auditService = auditService;
    }

    public List<InventoryDocument> list(String type, String status) {
        if (type != null && status != null) {
            return documentRepo.findByTypeAndStatus(type.toUpperCase(Locale.ROOT), status.toUpperCase(Locale.ROOT));
        }
        if (type != null) return documentRepo.findByType(type.toUpperCase(Locale.ROOT));
        if (status != null) return documentRepo.findByStatus(status.toUpperCase(Locale.ROOT));
        return documentRepo.findAll();
    }

    public InventoryDocument get(Long id) {
        return documentRepo.findByIdWithLines(id)
                .orElseThrow(() -> new NotFoundException("No existe el documento " + id));
    }

    @Transactional
    public InventoryDocument create(CreateDocumentRequest request, String username) {
        String type = request.type().trim().toUpperCase(Locale.ROOT);
        if (!InventoryDocument.Type.isValid(type)) {
            throw new BusinessException("Tipo de documento no válido: " + type);
        }

        Provider provider = null;
        if (type.equals(InventoryDocument.Type.ORDEN_COMPRA) || type.equals(InventoryDocument.Type.RECEPCION)) {
            if (request.providerName() == null || request.providerName().isBlank()) {
                throw new BusinessException("La orden de compra/recepción requiere proveedor");
            }
            provider = catalogService.ensureActiveProvider(request.providerName());
        }

        Location fromLoc = request.fromLocationId() == null ? null : locationRepo.findById(request.fromLocationId())
                .orElseThrow(() -> new BusinessException("Ubicación origen no existe"));
        Location toLoc = request.toLocationId() == null ? null : locationRepo.findById(request.toLocationId())
                .orElseThrow(() -> new BusinessException("Ubicación destino no existe"));

        // Validaciones por tipo
        switch (type) {
            case InventoryDocument.Type.TRANSFERENCIA -> {
                if (fromLoc == null || toLoc == null) {
                    throw new BusinessException("La transferencia requiere ubicación origen y destino");
                }
                if (fromLoc.getId().equals(toLoc.getId())) {
                    throw new BusinessException("La ubicación origen y destino deben ser distintas");
                }
            }
            case InventoryDocument.Type.ORDEN_COMPRA -> {
                // toLoc por defecto: BODEGA_PRINCIPAL si no viene
                if (toLoc == null) {
                    toLoc = locationRepo.findByCodeIgnoreCase("BODEGA_PRINCIPAL").orElse(null);
                }
            }
            case InventoryDocument.Type.AJUSTE, InventoryDocument.Type.CONTEO -> {
                if (toLoc == null) {
                    throw new BusinessException("El ajuste/conteo debe indicar la ubicación afectada");
                }
            }
            default -> { /* RECEPCION sin OC previa */ }
        }

        String initialStatus = type.equals(InventoryDocument.Type.ORDEN_COMPRA)
                ? InventoryDocument.Status.BORRADOR
                : InventoryDocument.Status.BORRADOR;

        InventoryDocument doc = new InventoryDocument(
                generateCode(type),
                type,
                initialStatus,
                provider,
                fromLoc,
                toLoc,
                username,
                request.notes()
        );

        int lineNumber = 1;
        for (CreateDocumentRequest.DocumentLineRequest l : request.lines()) {
            SupplyItem item = itemRepo.findById(l.itemId())
                    .orElseThrow(() -> new BusinessException("No existe el insumo " + l.itemId()));
            if (l.quantityExpected() == null) {
                throw new BusinessException("Cada línea debe indicar cantidad");
            }
            if (InventoryDocument.Type.AJUSTE.equals(type)) {
                if (l.quantityExpected() == 0) {
                    throw new BusinessException("El ajuste no puede tener cantidad cero");
                }
            } else if (l.quantityExpected() <= 0) {
                throw new BusinessException("Cada línea debe tener cantidad positiva");
            }
            InventoryDocumentLine line = new InventoryDocumentLine(
                    item, l.quantityExpected(), null, l.unitCost(), l.notes(), lineNumber++
            );
            doc.addLine(line);
        }
        InventoryDocument saved = documentRepo.save(doc);
        auditService.record("CREATE", "InventoryDocument", saved.getId(), username,
                saved.getCode() + " (" + saved.getType() + ", " + saved.getLines().size() + " líneas)");
        return saved;
    }

    @Transactional
    public InventoryDocument approve(Long id, String username) {
        InventoryDocument doc = get(id);
        if (!InventoryDocument.Type.ORDEN_COMPRA.equals(doc.getType())) {
            throw new BusinessException("Solo se aprueban órdenes de compra");
        }
        if (!InventoryDocument.Status.BORRADOR.equals(doc.getStatus())) {
            throw new BusinessException("Solo se aprueban documentos en BORRADOR");
        }
        doc.setStatus(InventoryDocument.Status.APROBADO);
        doc.setApprover(username);
        InventoryDocument saved = documentRepo.save(doc);
        auditService.record("APPROVE", "InventoryDocument", saved.getId(), username, saved.getCode());
        return saved;
    }

    @Transactional
    public InventoryDocument cancel(Long id, String reason, String username) {
        InventoryDocument doc = get(id);
        if (List.of(InventoryDocument.Status.RECIBIDO, InventoryDocument.Status.EJECUTADO)
                .contains(doc.getStatus())) {
            throw new BusinessException("No se puede cancelar un documento ya ejecutado");
        }
        doc.setStatus(InventoryDocument.Status.CANCELADO);
        doc.setNotes((doc.getNotes() == null ? "" : doc.getNotes() + " | ") + "Cancelado: " + reason);
        InventoryDocument saved = documentRepo.save(doc);
        auditService.record("CANCEL", "InventoryDocument", saved.getId(), username, reason);
        return saved;
    }

    /**
     * Registra la recepción de una orden de compra (o crea una recepción directa
     * si el documento ya es de tipo RECEPCION). Genera N movimientos ENTRADA con
     * fromLocation=null, toLocation=bodega correspondiente, vinculados al documento.
     */
    @Transactional
    public InventoryDocument receive(Long id, ReceiveDocumentRequest request, String username) {
        InventoryDocument doc = get(id);
        if (!List.of(InventoryDocument.Type.ORDEN_COMPRA, InventoryDocument.Type.RECEPCION).contains(doc.getType())) {
            throw new BusinessException("Solo se reciben documentos de tipo ORDEN_COMPRA o RECEPCION");
        }
        if (InventoryDocument.Status.RECIBIDO.equals(doc.getStatus())) {
            throw new BusinessException("El documento ya fue recibido");
        }
        if (InventoryDocument.Status.CANCELADO.equals(doc.getStatus())) {
            throw new BusinessException("El documento está cancelado");
        }
        if (InventoryDocument.Type.ORDEN_COMPRA.equals(doc.getType())
                && !InventoryDocument.Status.APROBADO.equals(doc.getStatus())) {
            throw new BusinessException("La orden de compra debe estar APROBADA antes de recibir");
        }

        // Determinar destino final
        Location toLocation = request.toLocationId() != null
                ? locationRepo.findById(request.toLocationId())
                .orElseThrow(() -> new BusinessException("Ubicación destino no existe"))
                : doc.getToLocationEntity();
        if (toLocation == null) {
            toLocation = locationRepo.findByCodeIgnoreCase("BODEGA_PRINCIPAL")
                    .orElseThrow(() -> new BusinessException("No se puede determinar la ubicación destino"));
        }
        if (!Boolean.TRUE.equals(toLocation.getActive())) {
            throw new BusinessException("La ubicación destino está inactiva");
        }

        // Aplicar cada línea
        for (ReceiveDocumentRequest.ReceiveLine rl : request.lines()) {
            InventoryDocumentLine line = doc.getLines().stream()
                    .filter(ln -> ln.getId().equals(rl.lineId()))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("Línea " + rl.lineId() + " no pertenece al documento"));
            int qty = rl.quantityActual() == null ? 0 : rl.quantityActual();
            if (qty < 0) {
                throw new BusinessException("La cantidad recibida no puede ser negativa");
            }
            line.setQuantityActual(qty);
            if (rl.unitCost() != null) {
                line.setUnitCost(rl.unitCost());
            }
            lineRepo.save(line);

            if (qty > 0) {
                BigDecimal quantity = QuantitySupport.toQuantity(qty);
                stockLocationService.incrementAt(line.getItemId(), toLocation.getId(), quantity);

                SupplyItem item = line.getItemEntity();
                int stockAfter = item.getStock() == null ? 0 : item.getStock();
                int stockBefore = stockAfter - qty;

                InventoryMovement mv = new InventoryMovement();
                mv.setItem(item);
                mv.setMovementType(InventoryMovement.Type.RECEPCION);
                mv.setOrigin("RECEPCION");
                mv.setQuantity(QuantitySupport.toCachedTotal(quantity));
                mv.setStockBefore(stockBefore);
                mv.setStockAfter(stockAfter);
                mv.setFromLocation(null);
                mv.setToLocation(toLocation);
                mv.setDocument(doc);
                mv.setProvider(doc.getProviderEntity());
                mv.setResponsible(username);
                mv.setOperationalResponsible(username);
                mv.setReferenceText("Recepción " + doc.getCode());
                mv.setUnitCost(line.getUnitCost());
                mv.setStatus("VALIDO");
                mv.setCreatedAt(LocalDateTime.now());
                mv.setLegacy(false);
                movementRepo.save(mv);
            }
        }

        doc.setStatus(InventoryDocument.Status.RECIBIDO);
        doc.setCompletedAt(LocalDateTime.now());
        doc.setToLocation(toLocation);
        if (request.notes() != null && !request.notes().isBlank()) {
            doc.setNotes((doc.getNotes() == null ? "" : doc.getNotes() + " | ") + "Recepción: " + request.notes());
        }
        InventoryDocument saved = documentRepo.save(doc);
        auditService.record("RECEIVE", "InventoryDocument", saved.getId(), username, saved.getCode());
        return saved;
    }

    /**
     * Ejecuta documentos que mueven stock: TRANSFERENCIA (entre ubicaciones) y AJUSTE
     * (delta positivo o negativo en una ubicación).
     */
    @Transactional
    public InventoryDocument execute(Long id, String username) {
        InventoryDocument doc = get(id);
        if (InventoryDocument.Status.CANCELADO.equals(doc.getStatus())) {
            throw new BusinessException("El documento está cancelado");
        }
        if (List.of(InventoryDocument.Status.RECIBIDO, InventoryDocument.Status.EJECUTADO)
                .contains(doc.getStatus())) {
            throw new BusinessException("El documento ya fue ejecutado");
        }
        if (!List.of(InventoryDocument.Type.TRANSFERENCIA, InventoryDocument.Type.AJUSTE).contains(doc.getType())) {
            throw new BusinessException("Solo se ejecutan documentos TRANSFERENCIA o AJUSTE");
        }
        if (!InventoryDocument.Status.BORRADOR.equals(doc.getStatus())) {
            throw new BusinessException("Solo se ejecutan documentos en BORRADOR");
        }

        if (InventoryDocument.Type.TRANSFERENCIA.equals(doc.getType())) {
            for (InventoryDocumentLine line : doc.getLines()) {
                stockLocationService.transferForDocument(doc, line, username);
            }
            doc.setStatus(InventoryDocument.Status.EJECUTADO);
        } else {
            Location location = doc.getToLocationEntity();
            if (location == null) {
                throw new BusinessException("El ajuste requiere ubicación destino");
            }
            for (InventoryDocumentLine line : doc.getLines()) {
                int rawQty = line.getQuantityActual() != null ? line.getQuantityActual() : line.getQuantityExpected();
                BigDecimal qty = QuantitySupport.toQuantity(rawQty);
                SupplyItem item = line.getItemEntity();
                int stockBefore = item.getStock() == null ? 0 : item.getStock();
                if (qty.compareTo(BigDecimal.ZERO) > 0) {
                    stockLocationService.incrementAt(item.getId(), location.getId(), qty);
                } else {
                    stockLocationService.decrementAt(item.getId(), location.getId(), qty.abs());
                }
                SupplyItem updated = itemRepo.findById(item.getId()).orElseThrow();
                int stockAfter = updated.getStock() == null ? 0 : updated.getStock();
                InventoryMovement mv = new InventoryMovement();
                mv.setItem(updated);
                mv.setMovementType(InventoryMovement.Type.AJUSTE);
                mv.setOrigin("AJUSTE");
                mv.setQuantity(QuantitySupport.toCachedTotal(qty.abs()));
                mv.setStockBefore(stockBefore);
                mv.setStockAfter(stockAfter);
                mv.setToLocation(location);
                mv.setDocument(doc);
                mv.setResponsible(username);
                mv.setOperationalResponsible(username);
                mv.setReferenceText("Ajuste documento " + doc.getCode());
                mv.setStatus("VALIDO");
                mv.setCreatedAt(LocalDateTime.now());
                mv.setLegacy(false);
                movementRepo.save(mv);
            }
            doc.setStatus(InventoryDocument.Status.EJECUTADO);
        }

        doc.setCompletedAt(LocalDateTime.now());
        doc.setApprover(username);
        InventoryDocument saved = documentRepo.save(doc);
        auditService.record("EXECUTE", "InventoryDocument", saved.getId(), username, saved.getCode());
        return saved;
    }

    /**
     * Crea un documento CONTEO en borrador con líneas tomadas del stock del sistema en la ubicación.
     */
    @Transactional
    public InventoryDocument initCount(InitCountRequest request, String username) {
        Location location = locationRepo.findById(request.locationId())
                .orElseThrow(() -> new BusinessException("Ubicación no existe"));
        if (!Boolean.TRUE.equals(location.getActive())) {
            throw new BusinessException("La ubicación está inactiva");
        }
        List<StockByLocation> rows = stockByLocationRepository.findByLocation_Id(location.getId());
        if (rows.isEmpty()) {
            throw new BusinessException("No hay stock registrado en " + location.getCode() + " para contar");
        }
        InventoryDocument doc = new InventoryDocument(
                generateCode(InventoryDocument.Type.CONTEO),
                InventoryDocument.Type.CONTEO,
                InventoryDocument.Status.BORRADOR,
                null,
                null,
                location,
                username,
                request.notes()
        );
        int lineNumber = 1;
        for (StockByLocation row : rows) {
            int systemQty = row.getQuantity() == null ? 0 : row.getQuantity().intValue();
            if (systemQty <= 0) {
                continue;
            }
            InventoryDocumentLine line = new InventoryDocumentLine(
                    row.getItemEntity(), systemQty, systemQty, null, null, lineNumber++
            );
            doc.addLine(line);
        }
        if (doc.getLines().isEmpty()) {
            throw new BusinessException("No hay cantidades positivas para incluir en el conteo");
        }
        InventoryDocument saved = documentRepo.save(doc);
        auditService.record("INIT_COUNT", "InventoryDocument", saved.getId(), username, location.getCode());
        return saved;
    }

    @Transactional
    public InventoryDocument recordCount(Long id, RecordCountRequest request, String username) {
        InventoryDocument doc = get(id);
        if (!InventoryDocument.Type.CONTEO.equals(doc.getType())) {
            throw new BusinessException("Solo aplica a documentos CONTEO");
        }
        if (!InventoryDocument.Status.BORRADOR.equals(doc.getStatus())) {
            throw new BusinessException("El conteo solo se registra en estado BORRADOR");
        }
        for (RecordCountRequest.CountLine rl : request.lines()) {
            InventoryDocumentLine line = doc.getLines().stream()
                    .filter(ln -> ln.getId().equals(rl.lineId()))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("Línea " + rl.lineId() + " no pertenece al documento"));
            if (rl.quantityActual() < 0) {
                throw new BusinessException("La cantidad contada no puede ser negativa");
            }
            line.setQuantityActual(rl.quantityActual());
            lineRepo.save(line);
        }
        if (request.notes() != null && !request.notes().isBlank()) {
            doc.setNotes((doc.getNotes() == null ? "" : doc.getNotes() + " | ") + request.notes());
        }
        InventoryDocument saved = documentRepo.save(doc);
        auditService.record("RECORD_COUNT", "InventoryDocument", saved.getId(), username, saved.getCode());
        return saved;
    }

    /**
     * Cierra el conteo: si hay diferencias requiere aprobación; si no, aplica ajustes de inmediato.
     */
    @Transactional
    public InventoryDocument completeCount(Long id, String username) {
        InventoryDocument doc = get(id);
        if (!InventoryDocument.Type.CONTEO.equals(doc.getType())) {
            throw new BusinessException("Solo aplica a documentos CONTEO");
        }
        if (!InventoryDocument.Status.BORRADOR.equals(doc.getStatus())) {
            throw new BusinessException("El conteo ya fue cerrado");
        }
        boolean hasVariance = false;
        for (InventoryDocumentLine line : doc.getLines()) {
            int expected = line.getQuantityExpected() == null ? 0 : line.getQuantityExpected();
            int actual = line.getQuantityActual() == null ? expected : line.getQuantityActual();
            if (actual != expected) {
                hasVariance = true;
                break;
            }
        }
        if (hasVariance) {
            doc.setStatus(InventoryDocument.Status.PENDIENTE_APROBACION);
            doc.setCompletedAt(LocalDateTime.now());
            InventoryDocument saved = documentRepo.save(doc);
            auditService.record("COMPLETE_COUNT_PENDING", "InventoryDocument", saved.getId(), username, saved.getCode());
            return saved;
        }
        return applyCountAdjustments(doc, username);
    }

    @Transactional
    public InventoryDocument approveVariance(Long id, String username) {
        InventoryDocument doc = get(id);
        if (!InventoryDocument.Type.CONTEO.equals(doc.getType())) {
            throw new BusinessException("Solo aplica a documentos CONTEO");
        }
        if (!InventoryDocument.Status.PENDIENTE_APROBACION.equals(doc.getStatus())) {
            throw new BusinessException("El documento no está pendiente de aprobación");
        }
        doc.setStatus(InventoryDocument.Status.APROBADO);
        doc.setApprover(username);
        InventoryDocument saved = documentRepo.save(doc);
        auditService.record("APPROVE_VARIANCE", "InventoryDocument", saved.getId(), username, saved.getCode());
        return saved;
    }

    @Transactional
    public InventoryDocument applyVariance(Long id, String username) {
        InventoryDocument doc = get(id);
        if (!InventoryDocument.Type.CONTEO.equals(doc.getType())) {
            throw new BusinessException("Solo aplica a documentos CONTEO");
        }
        if (!InventoryDocument.Status.APROBADO.equals(doc.getStatus())) {
            throw new BusinessException("El conteo debe estar APROBADO para aplicar diferencias al inventario");
        }
        return applyCountAdjustments(doc, username);
    }

    private InventoryDocument applyCountAdjustments(InventoryDocument doc, String username) {
        Location location = doc.getToLocationEntity();
        if (location == null) {
            throw new BusinessException("El conteo requiere ubicación");
        }
        for (InventoryDocumentLine line : doc.getLines()) {
            int expected = line.getQuantityExpected() == null ? 0 : line.getQuantityExpected();
            int actual = line.getQuantityActual() == null ? expected : line.getQuantityActual();
            int variance = actual - expected;
            if (variance == 0) {
                continue;
            }
            BigDecimal delta = QuantitySupport.toQuantity(Math.abs(variance));
            SupplyItem item = line.getItemEntity();
            int stockBefore = item.getStock() == null ? 0 : item.getStock();
            if (variance > 0) {
                stockLocationService.incrementAt(item.getId(), location.getId(), delta);
            } else {
                stockLocationService.decrementAt(item.getId(), location.getId(), delta);
            }
            SupplyItem updated = itemRepo.findById(item.getId()).orElseThrow();
            int stockAfter = updated.getStock() == null ? 0 : updated.getStock();
            InventoryMovement mv = new InventoryMovement();
            mv.setItem(updated);
            mv.setMovementType(InventoryMovement.Type.CONTEO);
            mv.setOrigin(variance < 0 ? "MERMA" : "CONTEO");
            mv.setQuantity(QuantitySupport.toCachedTotal(delta));
            mv.setStockBefore(stockBefore);
            mv.setStockAfter(stockAfter);
            mv.setToLocation(location);
            mv.setDocument(doc);
            mv.setResponsible(username);
            mv.setOperationalResponsible(username);
            mv.setReferenceText("Conteo " + doc.getCode() + " var=" + variance);
            mv.setStatus("VALIDO");
            mv.setCreatedAt(LocalDateTime.now());
            mv.setLegacy(false);
            movementRepo.save(mv);
        }
        doc.setStatus(InventoryDocument.Status.EJECUTADO);
        doc.setCompletedAt(LocalDateTime.now());
        doc.setApprover(username);
        InventoryDocument saved = documentRepo.save(doc);
        auditService.record("APPLY_VARIANCE", "InventoryDocument", saved.getId(), username, saved.getCode());
        return saved;
    }

    /* ---------- generación de códigos ---------- */

    private String generateCode(String type) {
        String prefix = switch (type) {
            case InventoryDocument.Type.ORDEN_COMPRA -> "OC";
            case InventoryDocument.Type.RECEPCION -> "REC";
            case InventoryDocument.Type.TRANSFERENCIA -> "TRF";
            case InventoryDocument.Type.CONTEO -> "CNT";
            case InventoryDocument.Type.AJUSTE -> "AJU";
            default -> "DOC";
        };
        String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy"));
        int next = nextSequenceFor(type, prefix + "-" + year + "-");
        return String.format("%s-%s-%04d", prefix, year, next);
    }

    private int nextSequenceFor(String type, String prefix) {
        return documentRepo.findMaxCodeByType(type)
                .filter(c -> c.startsWith(prefix))
                .map(c -> {
                    try {
                        return Integer.parseInt(c.substring(prefix.length())) + 1;
                    } catch (NumberFormatException ex) {
                        return 1;
                    }
                })
                .orElse(1);
    }
}
