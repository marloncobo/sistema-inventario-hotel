package com.hotel.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Saldo de un insumo en una ubicación específica.
 *
 * Es la pieza que rompe la idea de "stock global": el stock real de un
 * SupplyItem es la SUMA de sus StockByLocation. El campo SupplyItem.stock
 * se mantiene como caché total (para no romper código legacy), pero la
 * fuente de verdad son estos registros.
 */
@Entity
@Table(name = "stock_by_location",
        uniqueConstraints = @UniqueConstraint(name = "uq_stock_item_location", columnNames = {"item_id", "location_id"}),
        indexes = {
                @Index(name = "idx_stock_by_location_item", columnList = "item_id"),
                @Index(name = "idx_stock_by_location_location", columnList = "location_id")
        })
public class StockByLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_stock_location_item"))
    private SupplyItem item;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_stock_location_location"))
    private Location location;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;

    /** Stock mínimo OPCIONAL específico de esta ubicación (p. ej. mínimo en carrito). */
    private Integer minStock;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public StockByLocation() {}

    public StockByLocation(SupplyItem item, Location location, BigDecimal quantity) {
        this.item = item;
        this.location = location;
        this.quantity = quantity == null ? BigDecimal.ZERO : quantity;
    }

    public StockByLocation(SupplyItem item, Location location, int quantity) {
        this(item, location, BigDecimal.valueOf(quantity));
    }

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getItemId() { return item == null ? null : item.getId(); }
    public String getItemCode() { return item == null ? null : item.getCode(); }
    public String getItemName() { return item == null ? null : item.getName(); }
    @JsonIgnore
    public SupplyItem getItemEntity() { return item; }
    public Long getLocationId() { return location == null ? null : location.getId(); }
    public String getLocationCode() { return location == null ? null : location.getCode(); }
    public String getLocationName() { return location == null ? null : location.getName(); }
    public String getLocationType() { return location == null ? null : location.getType(); }
    @JsonIgnore
    public Location getLocationEntity() { return location; }
    public BigDecimal getQuantity() { return quantity; }
    public Integer getMinStock() { return minStock; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setId(Long id) { this.id = id; }
    public void setItem(SupplyItem item) { this.item = item; }
    public void setLocation(Location location) { this.location = location; }
    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity == null ? BigDecimal.ZERO : quantity;
    }
    public void setMinStock(Integer minStock) { this.minStock = minStock; }
}
