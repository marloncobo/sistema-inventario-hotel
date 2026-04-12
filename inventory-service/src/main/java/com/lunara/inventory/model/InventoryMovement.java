package com.lunara.inventory.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inventory_movements")
public class InventoryMovement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private MovementType type;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private MovementOrigin origin;
    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;
    @Column(name = "warehouse_name", nullable = false, length = 80)
    private String warehouseName;
    @Column(name = "responsible_user", nullable = false, length = 60)
    private String responsibleUser;
    @Column(name = "reference_number", length = 30)
    private String referenceNumber;
    @Column(length = 500)
    private String observations;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @JsonManagedReference
    @OneToMany(mappedBy = "inventoryMovement", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InventoryMovementLine> lines = new ArrayList<InventoryMovementLine>();
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MovementType getType() { return type; }
    public void setType(MovementType type) { this.type = type; }
    public MovementOrigin getOrigin() { return origin; }
    public void setOrigin(MovementOrigin origin) { this.origin = origin; }
    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }
    public String getWarehouseName() { return warehouseName; }
    public void setWarehouseName(String warehouseName) { this.warehouseName = warehouseName; }
    public String getResponsibleUser() { return responsibleUser; }
    public void setResponsibleUser(String responsibleUser) { this.responsibleUser = responsibleUser; }
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<InventoryMovementLine> getLines() { return lines; }
    public void setLines(List<InventoryMovementLine> lines) { this.lines = lines; }
}
