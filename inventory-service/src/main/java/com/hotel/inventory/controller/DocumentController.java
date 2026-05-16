package com.hotel.inventory.controller;

import com.hotel.inventory.dto.CreateDocumentRequest;
import com.hotel.inventory.dto.InitCountRequest;
import com.hotel.inventory.dto.ReceiveDocumentRequest;
import com.hotel.inventory.dto.RecordCountRequest;
import com.hotel.inventory.model.InventoryDocument;
import com.hotel.inventory.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Documentos multi-ítem: orden de compra, recepción, transferencia, conteo, ajuste.
 *
 *   POST /api/inventory/documents               → crear (BORRADOR)
 *   POST /api/inventory/documents/{id}/approve  → aprobar orden de compra
 *   POST /api/inventory/documents/{id}/receive  → registrar recepción
 *   POST /api/inventory/documents/{id}/execute  → ejecutar transferencia/ajuste
 *   POST /api/inventory/documents/{id}/cancel   → cancelar
 *   GET  /api/inventory/documents               → listar (filtros: type, status)
 *   GET  /api/inventory/documents/{id}          → detalle con líneas
 */
@RestController
@RequestMapping("/api/inventory/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public List<InventoryDocument> list(@RequestParam(value = "type", required = false) String type,
                                        @RequestParam(value = "status", required = false) String status) {
        return documentService.list(type, status);
    }

    @GetMapping("/{id}")
    public InventoryDocument get(@PathVariable Long id) {
        return documentService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
    public ResponseEntity<InventoryDocument> create(@Valid @RequestBody CreateDocumentRequest request,
                                                    Authentication authentication) {
        InventoryDocument doc = documentService.create(request, authentication.getName());
        return ResponseEntity.status(201).body(doc);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public InventoryDocument approve(@PathVariable Long id, Authentication authentication) {
        return documentService.approve(id, authentication.getName());
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
    public InventoryDocument receive(@PathVariable Long id,
                                     @Valid @RequestBody ReceiveDocumentRequest request,
                                     Authentication authentication) {
        return documentService.receive(id, request, authentication.getName());
    }

    @PostMapping("/{id}/execute")
    @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
    public InventoryDocument execute(@PathVariable Long id, Authentication authentication) {
        return documentService.execute(id, authentication.getName());
    }

    @PostMapping("/counts/init")
    @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
    public ResponseEntity<InventoryDocument> initCount(@Valid @RequestBody InitCountRequest request,
                                                       Authentication authentication) {
        InventoryDocument doc = documentService.initCount(request, authentication.getName());
        return ResponseEntity.status(201).body(doc);
    }

    @PostMapping("/{id}/record-count")
    @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
    public InventoryDocument recordCount(@PathVariable Long id,
                                         @Valid @RequestBody RecordCountRequest request,
                                         Authentication authentication) {
        return documentService.recordCount(id, request, authentication.getName());
    }

    @PostMapping("/{id}/complete-count")
    @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
    public InventoryDocument completeCount(@PathVariable Long id, Authentication authentication) {
        return documentService.completeCount(id, authentication.getName());
    }

    @PostMapping("/{id}/approve-variance")
    @PreAuthorize("hasRole('ADMIN')")
    public InventoryDocument approveVariance(@PathVariable Long id, Authentication authentication) {
        return documentService.approveVariance(id, authentication.getName());
    }

    @PostMapping("/{id}/apply-variance")
    @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
    public InventoryDocument applyVariance(@PathVariable Long id, Authentication authentication) {
        return documentService.applyVariance(id, authentication.getName());
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','ALMACENISTA')")
    public InventoryDocument cancel(@PathVariable Long id,
                                    @RequestBody(required = false) Map<String, String> body,
                                    Authentication authentication) {
        String reason = body == null ? "Cancelado" : body.getOrDefault("reason", "Cancelado");
        return documentService.cancel(id, reason, authentication.getName());
    }
}
