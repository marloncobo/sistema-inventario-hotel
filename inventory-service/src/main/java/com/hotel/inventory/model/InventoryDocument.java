package com.hotel.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Documento multi-ítem que agrupa varias líneas de inventario.
 *
 * Tipos:
 *  - ORDEN_COMPRA: solicita compra a proveedor (no afecta stock hasta recepción).
 *  - RECEPCION: registra entrada efectiva al inventario (cantidades reales).
 *  - TRANSFERENCIA: mueve stock entre ubicaciones (genera 1 movimiento por línea, atómico).
 *  - CONTEO: conteo físico (Fase 2).
 *  - AJUSTE: ajuste manual con justificación.
 *
 * Estados:
 *  - BORRADOR  → editable, no afecta stock
 *  - APROBADO  → aprobado (orden de compra emitida)
 *  - RECIBIDO  → recepción/transferencia ejecutada, stock movido
 *  - EJECUTADO → conteo/ajuste aplicado
 *  - CANCELADO → anulado, no afecta stock
 */
@Entity
@Table(name = "inventory_documents", indexes = {
        @Index(name = "idx_doc_type", columnList = "type"),
        @Index(name = "idx_doc_status", columnList = "status"),
        @Index(name = "idx_doc_code", columnList = "code", unique = true)
})
public class InventoryDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(nullable = false, length = 20)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id",
            foreignKey = @ForeignKey(name = "fk_doc_provider"))
    private Provider provider;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_location_id",
            foreignKey = @ForeignKey(name = "fk_doc_from_location"))
    private Location fromLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_location_id",
            foreignKey = @ForeignKey(name = "fk_doc_to_location"))
    private Location toLocation;

    @Column(nullable = false, length = 120)
    private String responsible;

    @Column(length = 120)
    private String approver;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<InventoryDocumentLine> lines = new ArrayList<>();

    public InventoryDocument() {}

    public InventoryDocument(String code, String type, String status, Provider provider,
                             Location fromLocation, Location toLocation, String responsible,
                             String notes) {
        this.code = code;
        this.type = type;
        this.status = status;
        this.provider = provider;
        this.fromLocation = fromLocation;
        this.toLocation = toLocation;
        this.responsible = responsible;
        this.notes = notes;
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public void addLine(InventoryDocumentLine line) {
        line.setDocument(this);
        this.lines.add(line);
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public Long getProviderId() { return provider == null ? null : provider.getId(); }
    public String getProviderName() { return provider == null ? null : provider.getName(); }
    @JsonIgnore
    public Provider getProviderEntity() { return provider; }
    public Long getFromLocationId() { return fromLocation == null ? null : fromLocation.getId(); }
    public String getFromLocationCode() { return fromLocation == null ? null : fromLocation.getCode(); }
    public String getFromLocationName() { return fromLocation == null ? null : fromLocation.getName(); }
    @JsonIgnore
    public Location getFromLocationEntity() { return fromLocation; }
    public Long getToLocationId() { return toLocation == null ? null : toLocation.getId(); }
    public String getToLocationCode() { return toLocation == null ? null : toLocation.getCode(); }
    public String getToLocationName() { return toLocation == null ? null : toLocation.getName(); }
    @JsonIgnore
    public Location getToLocationEntity() { return toLocation; }
    public String getResponsible() { return responsible; }
    public String getApprover() { return approver; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public List<InventoryDocumentLine> getLines() { return lines; }

    public void setId(Long id) { this.id = id; }
    public void setCode(String code) { this.code = code; }
    public void setType(String type) { this.type = type; }
    public void setStatus(String status) { this.status = status; }
    public void setProvider(Provider provider) { this.provider = provider; }
    public void setFromLocation(Location fromLocation) { this.fromLocation = fromLocation; }
    public void setToLocation(Location toLocation) { this.toLocation = toLocation; }
    public void setResponsible(String responsible) { this.responsible = responsible; }
    public void setApprover(String approver) { this.approver = approver; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public void setLines(List<InventoryDocumentLine> lines) { this.lines = lines; }

    public static final class Type {
        public static final String ORDEN_COMPRA = "ORDEN_COMPRA";
        public static final String RECEPCION = "RECEPCION";
        public static final String TRANSFERENCIA = "TRANSFERENCIA";
        public static final String CONTEO = "CONTEO";
        public static final String AJUSTE = "AJUSTE";

        private Type() {}

        public static boolean isValid(String value) {
            if (value == null) return false;
            return switch (value) {
                case ORDEN_COMPRA, RECEPCION, TRANSFERENCIA, CONTEO, AJUSTE -> true;
                default -> false;
            };
        }
    }

    public static final class Status {
        public static final String BORRADOR = "BORRADOR";
        public static final String APROBADO = "APROBADO";
        public static final String RECIBIDO = "RECIBIDO";
        public static final String EJECUTADO = "EJECUTADO";
        public static final String CANCELADO = "CANCELADO";
        /** Conteo cerrado con diferencias pendientes de aprobación administrativa. */
        public static final String PENDIENTE_APROBACION = "PENDIENTE_APROBACION";

        private Status() {}
    }
}
