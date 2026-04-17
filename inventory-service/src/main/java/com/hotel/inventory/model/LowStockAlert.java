package com.hotel.inventory.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "low_stock_alerts")
public class LowStockAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long itemId;
    @Column(nullable = false)
    private String itemName;
    @Column(nullable = false)
    private Integer currentStock;
    @Column(nullable = false)
    private Integer minStock;
    @Column(nullable = false)
    private String status;
    @Column(nullable = false)
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public LowStockAlert() {}

    public LowStockAlert(Long itemId, String itemName, Integer currentStock, Integer minStock, String status, LocalDateTime createdAt) {
        this.itemId = itemId;
        this.itemName = itemName;
        this.currentStock = currentStock;
        this.minStock = minStock;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getItemId() { return itemId; }
    public String getItemName() { return itemName; }
    public Integer getCurrentStock() { return currentStock; }
    public Integer getMinStock() { return minStock; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }

    public void setId(Long id) { this.id = id; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public void setCurrentStock(Integer currentStock) { this.currentStock = currentStock; }
    public void setMinStock(Integer minStock) { this.minStock = minStock; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
