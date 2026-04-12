package com.lunara.masterdata.dto;

import com.lunara.masterdata.model.RecordStatus;

import javax.validation.constraints.*;
import java.math.BigDecimal;

public final class MasterDataDtos {
    private MasterDataDtos() {}

    public static class AreaRequest {
        @NotBlank private String name;
        @NotBlank private String description;
        @NotBlank private String responsible;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getResponsible() { return responsible; }
        public void setResponsible(String responsible) { this.responsible = responsible; }
    }

    public static class WarehouseRequest {
        @NotBlank private String name;
        @NotBlank private String location;
        @NotBlank private String description;
        @NotNull private RecordStatus status;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public RecordStatus getStatus() { return status; }
        public void setStatus(RecordStatus status) { this.status = status; }
    }

    public static class CategoryRequest {
        @NotBlank private String name;
        @NotBlank private String description;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class UnitRequest {
        @NotBlank private String name;
        @NotBlank private String abbreviation;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getAbbreviation() { return abbreviation; }
        public void setAbbreviation(String abbreviation) { this.abbreviation = abbreviation; }
    }

    public static class SupplierRequest {
        @NotBlank private String name;
        @NotBlank private String taxId;
        private String phone;
        private String email;
        private String address;
        private String city;
        @NotNull private RecordStatus status;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getTaxId() { return taxId; }
        public void setTaxId(String taxId) { this.taxId = taxId; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public RecordStatus getStatus() { return status; }
        public void setStatus(RecordStatus status) { this.status = status; }
    }

    public static class ProductRequest {
        @NotBlank private String code;
        @NotBlank private String name;
        @NotBlank private String description;
        @NotNull private Long categoryId;
        @NotNull private Long unitId;
        private Long supplierId;
        @NotNull @DecimalMin(value = "0.0") private BigDecimal minimumStock;
        @DecimalMin(value = "0.0") private BigDecimal maximumStock;
        @NotNull @DecimalMin(value = "0.0") private BigDecimal averageCost;
        private boolean perishable;
        private boolean lotControl;
        private boolean expirationControl;
        @NotNull private RecordStatus status;
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Long getCategoryId() { return categoryId; }
        public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
        public Long getUnitId() { return unitId; }
        public void setUnitId(Long unitId) { this.unitId = unitId; }
        public Long getSupplierId() { return supplierId; }
        public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
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
}
