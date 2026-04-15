package com.hotel.inventory.model;

import jakarta.persistence.*;

@Entity
@Table(name = "supply_items")
public class SupplyItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    private String category;
    private String unit;
    @Column(nullable = false)
    private Integer stock;
    @Column(nullable = false)
    private Integer minStock;
    @Column(nullable = false)
    private Boolean active = true;

    public SupplyItem() {}

    public SupplyItem(String name, String category, String unit, Integer stock, Integer minStock, Boolean active) {
        this.name = name;
        this.category = category;
        this.unit = unit;
        this.stock = stock;
        this.minStock = minStock;
        this.active = active;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getUnit() { return unit; }
    public Integer getStock() { return stock; }
    public Integer getMinStock() { return minStock; }
    public Boolean getActive() { return active; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setCategory(String category) { this.category = category; }
    public void setUnit(String unit) { this.unit = unit; }
    public void setStock(Integer stock) { this.stock = stock; }
    public void setMinStock(Integer minStock) { this.minStock = minStock; }
    public void setActive(Boolean active) { this.active = active; }
}