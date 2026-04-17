package com.hotel.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "low_stock_alerts")
public class LowStockAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false, foreignKey = @ForeignKey(name = "fk_low_stock_alerts_item"))
    private SupplyItem item;
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

    public LowStockAlert(SupplyItem item, Integer currentStock, Integer minStock, String status, LocalDateTime createdAt) {
        this.item = item;
        this.currentStock = currentStock;
        this.minStock = minStock;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getItemId() { return item == null ? null : item.getId(); }
    public String getItemName() { return item == null ? null : item.getName(); }
    @JsonIgnore
    public SupplyItem getItemEntity() { return item; }
    public Integer getCurrentStock() { return currentStock; }
    public Integer getMinStock() { return minStock; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }

    public void setId(Long id) { this.id = id; }
    public void setItem(SupplyItem item) { this.item = item; }
    public void setCurrentStock(Integer currentStock) { this.currentStock = currentStock; }
    public void setMinStock(Integer minStock) { this.minStock = minStock; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
