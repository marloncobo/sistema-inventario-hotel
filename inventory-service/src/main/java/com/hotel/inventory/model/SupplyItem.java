package com.hotel.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false, foreignKey = @ForeignKey(name = "fk_supply_items_category"))
    private Category category;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false, foreignKey = @ForeignKey(name = "fk_supply_items_unit"))
    private UnitOfMeasure unit;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", foreignKey = @ForeignKey(name = "fk_supply_items_provider"))
    private Provider provider;
    @Column(nullable = false)
    private Integer stock;
    @Column(nullable = false)
    private Integer minStock;
    private Integer maxStock;
    @Column(nullable = false)
    private Boolean active = true;

    public SupplyItem() {}

    public SupplyItem(String name, Category category, UnitOfMeasure unit, Integer stock, Integer minStock, Boolean active) {
        this(null, name, null, category, unit, null, stock, minStock, null, active);
    }

    public SupplyItem(String code, String name, String description, Category category, UnitOfMeasure unit, Provider provider,
                      Integer stock, Integer minStock, Integer maxStock, Boolean active) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.category = category;
        this.unit = unit;
        this.provider = provider;
        this.stock = stock;
        this.minStock = minStock;
        this.maxStock = maxStock;
        this.active = active;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getCategory() { return category == null ? null : category.getCode(); }
    public String getUnit() { return unit == null ? null : unit.getAbbreviation(); }
    public String getProviderName() { return provider == null ? null : provider.getName(); }
    @JsonIgnore
    public Category getCategoryEntity() { return category; }
    @JsonIgnore
    public UnitOfMeasure getUnitEntity() { return unit; }
    @JsonIgnore
    public Provider getProviderEntity() { return provider; }
    public Integer getStock() { return stock; }
    public Integer getMinStock() { return minStock; }
    public Integer getMaxStock() { return maxStock; }
    public Boolean getActive() { return active; }

    public void setId(Long id) { this.id = id; }
    public void setCode(String code) { this.code = code; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setCategory(Category category) { this.category = category; }
    public void setUnit(UnitOfMeasure unit) { this.unit = unit; }
    public void setProvider(Provider provider) { this.provider = provider; }
    public void setStock(Integer stock) { this.stock = stock; }
    public void setMinStock(Integer minStock) { this.minStock = minStock; }
    public void setMaxStock(Integer maxStock) { this.maxStock = maxStock; }
    public void setActive(Boolean active) { this.active = active; }
}
