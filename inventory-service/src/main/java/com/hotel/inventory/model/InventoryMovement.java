package com.hotel.inventory.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_movements")
public class InventoryMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long itemId;
    @Column(nullable = false)
    private String itemName;
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
    private String areaName;
    private String providerName;
    @Column(nullable = false)
    private String responsible;
    private String referenceText;
    @Column(nullable = false)
    private String status;
    @Column(nullable = false)
    private LocalDateTime createdAt;

    public InventoryMovement() {}

    public InventoryMovement(Long itemId, String itemName, String movementType, Integer quantity, String roomNumber, String referenceText, LocalDateTime createdAt) {
        this(itemId, itemName, movementType, "NO_APLICA", quantity, 0, quantity, roomNumber, null, null, "sistema", referenceText, "VALIDO", createdAt);
    }

    public InventoryMovement(Long itemId, String itemName, String movementType, String origin, Integer quantity,
                             Integer stockBefore, Integer stockAfter, String roomNumber, String areaName,
                             String providerName, String responsible, String referenceText, String status,
                             LocalDateTime createdAt) {
        this.itemId = itemId;
        this.itemName = itemName;
        this.movementType = movementType;
        this.origin = origin;
        this.quantity = quantity;
        this.stockBefore = stockBefore;
        this.stockAfter = stockAfter;
        this.roomNumber = roomNumber;
        this.areaName = areaName;
        this.providerName = providerName;
        this.responsible = responsible;
        this.referenceText = referenceText;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getItemId() { return itemId; }
    public String getItemName() { return itemName; }
    public String getMovementType() { return movementType; }
    public String getOrigin() { return origin; }
    public Integer getQuantity() { return quantity; }
    public Integer getStockBefore() { return stockBefore; }
    public Integer getStockAfter() { return stockAfter; }
    public String getRoomNumber() { return roomNumber; }
    public String getAreaName() { return areaName; }
    public String getProviderName() { return providerName; }
    public String getResponsible() { return responsible; }
    public String getReferenceText() { return referenceText; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public void setMovementType(String movementType) { this.movementType = movementType; }
    public void setOrigin(String origin) { this.origin = origin; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public void setStockBefore(Integer stockBefore) { this.stockBefore = stockBefore; }
    public void setStockAfter(Integer stockAfter) { this.stockAfter = stockAfter; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    public void setAreaName(String areaName) { this.areaName = areaName; }
    public void setProviderName(String providerName) { this.providerName = providerName; }
    public void setResponsible(String responsible) { this.responsible = responsible; }
    public void setReferenceText(String referenceText) { this.referenceText = referenceText; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
