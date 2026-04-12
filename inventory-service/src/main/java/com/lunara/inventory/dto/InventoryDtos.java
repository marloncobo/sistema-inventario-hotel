package com.lunara.inventory.dto;

import javax.validation.Valid;
import javax.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class InventoryDtos {
    private InventoryDtos() {}

    public static class StockLoadRequest extends MovementRequest {
        @NotNull @DecimalMin("0.0") private BigDecimal minimumStock;
        @DecimalMin("0.0") private BigDecimal maximumStock;
        public BigDecimal getMinimumStock() { return minimumStock; }
        public void setMinimumStock(BigDecimal minimumStock) { this.minimumStock = minimumStock; }
        public BigDecimal getMaximumStock() { return maximumStock; }
        public void setMaximumStock(BigDecimal maximumStock) { this.maximumStock = maximumStock; }
    }

    public static class MovementRequest {
        @NotNull private Long productId;
        @NotBlank private String productCode;
        @NotBlank private String productName;
        @NotNull private Long warehouseId;
        @NotBlank private String warehouseName;
        @NotNull @DecimalMin("0.01") private BigDecimal quantity;
        @NotNull @DecimalMin("0.0") private BigDecimal unitCost;
        private String lot;
        private LocalDate expirationDate;
        @NotBlank private String observations;
        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public String getProductCode() { return productCode; }
        public void setProductCode(String productCode) { this.productCode = productCode; }
        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        public Long getWarehouseId() { return warehouseId; }
        public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }
        public String getWarehouseName() { return warehouseName; }
        public void setWarehouseName(String warehouseName) { this.warehouseName = warehouseName; }
        public BigDecimal getQuantity() { return quantity; }
        public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
        public BigDecimal getUnitCost() { return unitCost; }
        public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
        public String getLot() { return lot; }
        public void setLot(String lot) { this.lot = lot; }
        public LocalDate getExpirationDate() { return expirationDate; }
        public void setExpirationDate(LocalDate expirationDate) { this.expirationDate = expirationDate; }
        public String getObservations() { return observations; }
        public void setObservations(String observations) { this.observations = observations; }
    }

    public static class PurchaseOrderRequest {
        @NotNull private Long supplierId;
        @NotBlank private String supplierName;
        private LocalDate expectedDate;
        private String observations;
        @Valid @NotEmpty private List<PurchaseOrderLineRequest> lines;
        public Long getSupplierId() { return supplierId; }
        public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
        public String getSupplierName() { return supplierName; }
        public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
        public LocalDate getExpectedDate() { return expectedDate; }
        public void setExpectedDate(LocalDate expectedDate) { this.expectedDate = expectedDate; }
        public String getObservations() { return observations; }
        public void setObservations(String observations) { this.observations = observations; }
        public List<PurchaseOrderLineRequest> getLines() { return lines; }
        public void setLines(List<PurchaseOrderLineRequest> lines) { this.lines = lines; }
    }

    public static class PurchaseOrderLineRequest {
        @NotNull private Long productId;
        @NotBlank private String productCode;
        @NotBlank private String productName;
        @NotNull @DecimalMin("0.01") private BigDecimal quantity;
        @NotNull @DecimalMin("0.0") private BigDecimal unitPrice;
        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public String getProductCode() { return productCode; }
        public void setProductCode(String productCode) { this.productCode = productCode; }
        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        public BigDecimal getQuantity() { return quantity; }
        public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    }

    public static class ReceiptRequest {
        @NotNull private Long warehouseId;
        @NotBlank private String warehouseName;
        @Valid @NotEmpty private List<ReceiptLineRequest> lines;
        private String observations;
        public Long getWarehouseId() { return warehouseId; }
        public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }
        public String getWarehouseName() { return warehouseName; }
        public void setWarehouseName(String warehouseName) { this.warehouseName = warehouseName; }
        public List<ReceiptLineRequest> getLines() { return lines; }
        public void setLines(List<ReceiptLineRequest> lines) { this.lines = lines; }
        public String getObservations() { return observations; }
        public void setObservations(String observations) { this.observations = observations; }
    }

    public static class ReceiptLineRequest {
        @NotNull private Long purchaseOrderLineId;
        @NotNull @DecimalMin("0.01") private BigDecimal quantity;
        private String lot;
        private LocalDate expirationDate;
        public Long getPurchaseOrderLineId() { return purchaseOrderLineId; }
        public void setPurchaseOrderLineId(Long purchaseOrderLineId) { this.purchaseOrderLineId = purchaseOrderLineId; }
        public BigDecimal getQuantity() { return quantity; }
        public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
        public String getLot() { return lot; }
        public void setLot(String lot) { this.lot = lot; }
        public LocalDate getExpirationDate() { return expirationDate; }
        public void setExpirationDate(LocalDate expirationDate) { this.expirationDate = expirationDate; }
    }

    public static class InternalRequestCreate {
        @NotNull private Long areaId;
        @NotBlank private String areaName;
        private String observations;
        @Valid @NotEmpty private List<RequestLineCreate> lines;
        public Long getAreaId() { return areaId; }
        public void setAreaId(Long areaId) { this.areaId = areaId; }
        public String getAreaName() { return areaName; }
        public void setAreaName(String areaName) { this.areaName = areaName; }
        public String getObservations() { return observations; }
        public void setObservations(String observations) { this.observations = observations; }
        public List<RequestLineCreate> getLines() { return lines; }
        public void setLines(List<RequestLineCreate> lines) { this.lines = lines; }
    }

    public static class RequestLineCreate {
        @NotNull private Long productId;
        @NotBlank private String productCode;
        @NotBlank private String productName;
        @NotNull @DecimalMin("0.01") private BigDecimal requestedQuantity;
        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public String getProductCode() { return productCode; }
        public void setProductCode(String productCode) { this.productCode = productCode; }
        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        public BigDecimal getRequestedQuantity() { return requestedQuantity; }
        public void setRequestedQuantity(BigDecimal requestedQuantity) { this.requestedQuantity = requestedQuantity; }
    }

    public static class InternalRequestApproval {
        @NotNull private Boolean approved;
        private String observations;
        @Valid private List<ApprovalLine> lines;
        public Boolean getApproved() { return approved; }
        public void setApproved(Boolean approved) { this.approved = approved; }
        public String getObservations() { return observations; }
        public void setObservations(String observations) { this.observations = observations; }
        public List<ApprovalLine> getLines() { return lines; }
        public void setLines(List<ApprovalLine> lines) { this.lines = lines; }
    }

    public static class ApprovalLine {
        @NotNull private Long requestLineId;
        @NotNull @DecimalMin("0.0") private BigDecimal approvedQuantity;
        public Long getRequestLineId() { return requestLineId; }
        public void setRequestLineId(Long requestLineId) { this.requestLineId = requestLineId; }
        public BigDecimal getApprovedQuantity() { return approvedQuantity; }
        public void setApprovedQuantity(BigDecimal approvedQuantity) { this.approvedQuantity = approvedQuantity; }
    }

    public static class DispatchRequest {
        @NotNull private Long warehouseId;
        @NotBlank private String warehouseName;
        private String observations;
        @Valid @NotEmpty private List<DispatchLine> lines;
        public Long getWarehouseId() { return warehouseId; }
        public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }
        public String getWarehouseName() { return warehouseName; }
        public void setWarehouseName(String warehouseName) { this.warehouseName = warehouseName; }
        public String getObservations() { return observations; }
        public void setObservations(String observations) { this.observations = observations; }
        public List<DispatchLine> getLines() { return lines; }
        public void setLines(List<DispatchLine> lines) { this.lines = lines; }
    }

    public static class DispatchLine {
        @NotNull private Long requestLineId;
        @NotNull @DecimalMin("0.01") private BigDecimal dispatchedQuantity;
        public Long getRequestLineId() { return requestLineId; }
        public void setRequestLineId(Long requestLineId) { this.requestLineId = requestLineId; }
        public BigDecimal getDispatchedQuantity() { return dispatchedQuantity; }
        public void setDispatchedQuantity(BigDecimal dispatchedQuantity) { this.dispatchedQuantity = dispatchedQuantity; }
    }
}
