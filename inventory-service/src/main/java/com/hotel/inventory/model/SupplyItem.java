package com.hotel.inventory.model;

import jakarta.persistence.*;

@Entity
@Table(name = "supply_items")
public class SupplyItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 40)
    private String code;
    @Column(nullable = false, unique = true)
    private String name;
    @Column(length = 500)
    private String description;
    private String category;
    private String unit;
    private String providerName;
    @Column(nullable = false)
    private Integer stock;
    @Column(nullable = false)
    private Integer minStock;
    private Integer maxStock;
    @Column(nullable = false)
    private Boolean active = true;

    public SupplyItem() {}

    public SupplyItem(String name, String category, String unit, Integer stock, Integer minStock, Boolean active) {
        this(null, name, null, category, unit, null, stock, minStock, null, active);
    }

    public SupplyItem(String code, String name, String description, String category, String unit, String providerName,
                      Integer stock, Integer minStock, Integer maxStock, Boolean active) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.category = category;
        this.unit = unit;
        this.providerName = providerName;
        this.stock = stock;
        this.minStock = minStock;
        this.maxStock = maxStock;
        this.active = active;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public String getUnit() { return unit; }
    public String getProviderName() { return providerName; }
    public Integer getStock() { return stock; }
    public Integer getMinStock() { return minStock; }
    public Integer getMaxStock() { return maxStock; }
    public Boolean getActive() { return active; }

    public void setId(Long id) { this.id = id; }
    public void setCode(String code) { this.code = code; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setCategory(String category) { this.category = category; }
    public void setUnit(String unit) { this.unit = unit; }
    public void setProviderName(String providerName) { this.providerName = providerName; }
    public void setStock(Integer stock) { this.stock = stock; }
    public void setMinStock(Integer minStock) { this.minStock = minStock; }
    public void setMaxStock(Integer maxStock) { this.maxStock = maxStock; }
    public void setActive(Boolean active) { this.active = active; }
}
