package com.lunara.inventory.model;

import com.fasterxml.jackson.annotation.JsonBackReference;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "inventory_movement_lines")
public class InventoryMovementLine {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @JsonBackReference
    @ManyToOne(optional = false) @JoinColumn(name = "inventory_movement_id")
    private InventoryMovement inventoryMovement;
    @Column(name = "product_id", nullable = false)
    private Long productId;
    @Column(name = "product_code", nullable = false, length = 40)
    private String productCode;
    @Column(name = "product_name", nullable = false, length = 120)
    private String productName;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;
    @Column(name = "unit_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitCost;
    @Column(length = 50)
    private String lot;
    @Column(name = "expiration_date")
    private LocalDate expirationDate;
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public InventoryMovement getInventoryMovement() { return inventoryMovement; }
    public void setInventoryMovement(InventoryMovement inventoryMovement) { this.inventoryMovement = inventoryMovement; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public String getLot() { return lot; }
    public void setLot(String lot) { this.lot = lot; }
    public LocalDate getExpirationDate() { return expirationDate; }
    public void setExpirationDate(LocalDate expirationDate) { this.expirationDate = expirationDate; }
}
