package com.hotel.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_movements")
public class InventoryMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false, foreignKey = @ForeignKey(name = "fk_inventory_movements_item"))
    private SupplyItem item;
    @Column(nullable = false)
    private String movementType;
    @Column(nullable = false)
    private String origin;
    @Column(nullable = false)
    private Integer quantity;
    @Column(nullable = false)
    private Integer stockBefore;
    @Column(nullable = false)
    private Integer stockAfter;
    private String roomNumber;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id", foreignKey = @ForeignKey(name = "fk_inventory_movements_area"))
    private Area area;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", foreignKey = @ForeignKey(name = "fk_inventory_movements_provider"))
    private Provider provider;
    @Column(nullable = false)
    private String responsible;
    private String operationalResponsible;
    private String referenceText;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_movement_id", foreignKey = @ForeignKey(name = "fk_inventory_movements_source"))
    private InventoryMovement sourceMovement;
    private String correctionReason;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "correction_movement_id", foreignKey = @ForeignKey(name = "fk_inventory_movements_correction"))
    private InventoryMovement correctionMovement;
    @Column(nullable = false)
    private String status;
    @Column(nullable = false)
    private LocalDateTime createdAt;

    public InventoryMovement() {}

    public InventoryMovement(SupplyItem item, String movementType, Integer quantity, String roomNumber, String referenceText, LocalDateTime createdAt) {
        this(item, movementType, "NO_APLICA", quantity, 0, quantity, roomNumber, null, null, "sistema", referenceText, "VALIDO", createdAt);
    }

    public InventoryMovement(SupplyItem item, String movementType, String origin, Integer quantity,
                             Integer stockBefore, Integer stockAfter, String roomNumber, Area area,
                             Provider provider, String responsible, String referenceText, String status,
                             LocalDateTime createdAt) {
        this.item = item;
        this.movementType = movementType;
        this.origin = origin;
        this.quantity = quantity;
        this.stockBefore = stockBefore;
        this.stockAfter = stockAfter;
        this.roomNumber = roomNumber;
        this.area = area;
        this.provider = provider;
        this.responsible = responsible;
        this.referenceText = referenceText;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getItemId() { return item == null ? null : item.getId(); }
    public String getItemName() { return item == null ? null : item.getName(); }
    @JsonIgnore
    public SupplyItem getItemEntity() { return item; }
    public String getMovementType() { return movementType; }
    public String getOrigin() { return origin; }
    public Integer getQuantity() { return quantity; }
    public Integer getStockBefore() { return stockBefore; }
    public Integer getStockAfter() { return stockAfter; }
    public String getRoomNumber() { return roomNumber; }
    public String getAreaName() { return area == null ? null : area.getName(); }
    public String getProviderName() { return provider == null ? null : provider.getName(); }
    @JsonIgnore
    public Area getAreaEntity() { return area; }
    @JsonIgnore
    public Provider getProviderEntity() { return provider; }
    public String getResponsible() { return responsible; }
    public String getOperationalResponsible() { return operationalResponsible; }
    public String getReferenceText() { return referenceText; }
    public Long getSourceMovementId() { return sourceMovement == null ? null : sourceMovement.getId(); }
    public String getCorrectionReason() { return correctionReason; }
    public Long getCorrectionMovementId() { return correctionMovement == null ? null : correctionMovement.getId(); }
    @JsonIgnore
    public InventoryMovement getSourceMovementEntity() { return sourceMovement; }
    @JsonIgnore
    public InventoryMovement getCorrectionMovementEntity() { return correctionMovement; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setItem(SupplyItem item) { this.item = item; }
    public void setMovementType(String movementType) { this.movementType = movementType; }
    public void setOrigin(String origin) { this.origin = origin; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public void setStockBefore(Integer stockBefore) { this.stockBefore = stockBefore; }
    public void setStockAfter(Integer stockAfter) { this.stockAfter = stockAfter; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    public void setArea(Area area) { this.area = area; }
    public void setProvider(Provider provider) { this.provider = provider; }
    public void setResponsible(String responsible) { this.responsible = responsible; }
    public void setOperationalResponsible(String operationalResponsible) { this.operationalResponsible = operationalResponsible; }
    public void setReferenceText(String referenceText) { this.referenceText = referenceText; }
    public void setSourceMovement(InventoryMovement sourceMovement) { this.sourceMovement = sourceMovement; }
    public void setCorrectionReason(String correctionReason) { this.correctionReason = correctionReason; }
    public void setCorrectionMovement(InventoryMovement correctionMovement) { this.correctionMovement = correctionMovement; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
