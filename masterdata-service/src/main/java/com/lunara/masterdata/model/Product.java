package com.lunara.masterdata.model;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 40)
    private String code;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(nullable = false, length = 500)
    private String description;
    @ManyToOne(optional = false) @JoinColumn(name = "category_id")
    private Category category;
    @ManyToOne(optional = false) @JoinColumn(name = "unit_id")
    private Unit unit;
    @ManyToOne @JoinColumn(name = "supplier_id")
    private Supplier supplier;
    @Column(name = "minimum_stock", nullable = false, precision = 12, scale = 2)
    private BigDecimal minimumStock;
    @Column(name = "maximum_stock", precision = 12, scale = 2)
    private BigDecimal maximumStock;
    @Column(name = "average_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal averageCost;
    @Column(nullable = false)
    private boolean perishable;
    @Column(name = "lot_control", nullable = false)
    private boolean lotControl;
    @Column(name = "expiration_control", nullable = false)
    private boolean expirationControl;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private RecordStatus status;
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public Unit getUnit() { return unit; }
    public void setUnit(Unit unit) { this.unit = unit; }
    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier supplier) { this.supplier = supplier; }
    public BigDecimal getMinimumStock() { return minimumStock; }
    public void setMinimumStock(BigDecimal minimumStock) { this.minimumStock = minimumStock; }
    public BigDecimal getMaximumStock() { return maximumStock; }
    public void setMaximumStock(BigDecimal maximumStock) { this.maximumStock = maximumStock; }
    public BigDecimal getAverageCost() { return averageCost; }
    public void setAverageCost(BigDecimal averageCost) { this.averageCost = averageCost; }
    public boolean isPerishable() { return perishable; }
    public void setPerishable(boolean perishable) { this.perishable = perishable; }
    public boolean isLotControl() { return lotControl; }
    public void setLotControl(boolean lotControl) { this.lotControl = lotControl; }
    public boolean isExpirationControl() { return expirationControl; }
    public void setExpirationControl(boolean expirationControl) { this.expirationControl = expirationControl; }
    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }
}
