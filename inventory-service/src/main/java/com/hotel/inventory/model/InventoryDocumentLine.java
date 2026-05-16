package com.hotel.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * Línea de un documento de inventario (ej. una orden de compra de 3 ítems = 3 líneas).
 *
 * quantityExpected: lo que se PIDIÓ (orden de compra) o lo que el sistema dice
 *                   que hay (conteo).
 * quantityActual:   lo que realmente se RECIBIÓ / CONTÓ. En transferencias y
 *                   recepciones puras es igual a la expected; en recepciones
 *                   parciales o conteos puede diferir.
 * unitCost:         costo unitario al momento del movimiento (Fase 3, pero la
 *                   columna ya nace ahora).
 */
@Entity
@Table(name = "inventory_document_lines", indexes = {
        @Index(name = "idx_doc_line_document", columnList = "document_id"),
        @Index(name = "idx_doc_line_item", columnList = "item_id")
})
public class InventoryDocumentLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_doc_line_document"))
    @JsonIgnore
    private InventoryDocument document;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_doc_line_item"))
    private SupplyItem item;

    @Column(nullable = false)
    private Integer quantityExpected;

    private Integer quantityActual;

    @Column(precision = 14, scale = 2)
    private BigDecimal unitCost;

    @Column(length = 300)
    private String notes;

    @Column(nullable = false)
    private Integer lineNumber;

    public InventoryDocumentLine() {}

    public InventoryDocumentLine(SupplyItem item, Integer quantityExpected, Integer quantityActual,
                                 BigDecimal unitCost, String notes, Integer lineNumber) {
        this.item = item;
        this.quantityExpected = quantityExpected;
        this.quantityActual = quantityActual;
        this.unitCost = unitCost;
        this.notes = notes;
        this.lineNumber = lineNumber;
    }

    public Long getId() { return id; }
    public Long getDocumentId() { return document == null ? null : document.getId(); }
    @JsonIgnore
    public InventoryDocument getDocumentEntity() { return document; }
    public Long getItemId() { return item == null ? null : item.getId(); }
    public String getItemCode() { return item == null ? null : item.getCode(); }
    public String getItemName() { return item == null ? null : item.getName(); }
    @JsonIgnore
    public SupplyItem getItemEntity() { return item; }
    public Integer getQuantityExpected() { return quantityExpected; }
    public Integer getQuantityActual() { return quantityActual; }
    public BigDecimal getUnitCost() { return unitCost; }
    public BigDecimal getTotalCost() {
        if (unitCost == null) return null;
        int qty = quantityActual != null ? quantityActual : quantityExpected;
        return unitCost.multiply(BigDecimal.valueOf(qty));
    }
    public String getNotes() { return notes; }
    public Integer getLineNumber() { return lineNumber; }

    public void setId(Long id) { this.id = id; }
    public void setDocument(InventoryDocument document) { this.document = document; }
    public void setItem(SupplyItem item) { this.item = item; }
    public void setQuantityExpected(Integer quantityExpected) { this.quantityExpected = quantityExpected; }
    public void setQuantityActual(Integer quantityActual) { this.quantityActual = quantityActual; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setLineNumber(Integer lineNumber) { this.lineNumber = lineNumber; }
}
