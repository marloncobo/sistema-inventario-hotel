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
    private Integer quantity;
    private String roomNumber;
    private String referenceText;
    @Column(nullable = false)
    private LocalDateTime createdAt;

    public InventoryMovement() {}

    public InventoryMovement(Long itemId, String itemName, String movementType, Integer quantity, String roomNumber, String referenceText, LocalDateTime createdAt) {
        this.itemId = itemId;
        this.itemName = itemName;
        this.movementType = movementType;
        this.quantity = quantity;
        this.roomNumber = roomNumber;
        this.referenceText = referenceText;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getItemId() { return itemId; }
    public String getItemName() { return itemName; }
    public String getMovementType() { return movementType; }
    public Integer getQuantity() { return quantity; }
    public String getRoomNumber() { return roomNumber; }
    public String getReferenceText() { return referenceText; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public void setMovementType(String movementType) { this.movementType = movementType; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    public void setReferenceText(String referenceText) { this.referenceText = referenceText; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}