package com.hotel.rooms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_supply_assignments")
public class RoomSupplyAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long roomId;
    @Column(nullable = false)
    private String roomNumber;
    @Column(nullable = false)
    private Long itemId;
    @Column(nullable = false)
    private String itemName;
    @Column(nullable = false)
    private Integer quantity;
    @Column(nullable = false)
    private String deliveredBy;
    private String guestName;
    @Column(nullable = false)
    private String assignmentType;
    @Column(nullable = false)
    private LocalDateTime createdAt;

    public RoomSupplyAssignment() {}

    public RoomSupplyAssignment(Long roomId, String roomNumber, Long itemId, String itemName, Integer quantity, String deliveredBy, String guestName, LocalDateTime createdAt) {
        this(roomId, roomNumber, itemId, itemName, quantity, deliveredBy, guestName, "HABITACION", createdAt);
    }

    public RoomSupplyAssignment(Long roomId, String roomNumber, Long itemId, String itemName, Integer quantity,
                                String deliveredBy, String guestName, String assignmentType, LocalDateTime createdAt) {
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.itemId = itemId;
        this.itemName = itemName;
        this.quantity = quantity;
        this.deliveredBy = deliveredBy;
        this.guestName = guestName;
        this.assignmentType = assignmentType;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getRoomId() { return roomId; }
    public String getRoomNumber() { return roomNumber; }
    public Long getItemId() { return itemId; }
    public String getItemName() { return itemName; }
    public Integer getQuantity() { return quantity; }
    public String getDeliveredBy() { return deliveredBy; }
    public String getGuestName() { return guestName; }
    public String getAssignmentType() { return assignmentType; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public void setDeliveredBy(String deliveredBy) { this.deliveredBy = deliveredBy; }
    public void setGuestName(String guestName) { this.guestName = guestName; }
    public void setAssignmentType(String assignmentType) { this.assignmentType = assignmentType; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
