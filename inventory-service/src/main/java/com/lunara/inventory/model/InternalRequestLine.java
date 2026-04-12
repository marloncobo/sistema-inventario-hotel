package com.lunara.inventory.model;

import com.fasterxml.jackson.annotation.JsonBackReference;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "internal_request_lines")
public class InternalRequestLine {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @JsonBackReference
    @ManyToOne(optional = false) @JoinColumn(name = "internal_request_id")
    private InternalRequest internalRequest;
    @Column(name = "product_id", nullable = false)
    private Long productId;
    @Column(name = "product_code", nullable = false, length = 40)
    private String productCode;
    @Column(name = "product_name", nullable = false, length = 120)
    private String productName;
    @Column(name = "requested_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal requestedQuantity;
    @Column(name = "approved_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal approvedQuantity;
    @Column(name = "dispatched_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal dispatchedQuantity;
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public InternalRequest getInternalRequest() { return internalRequest; }
    public void setInternalRequest(InternalRequest internalRequest) { this.internalRequest = internalRequest; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public BigDecimal getRequestedQuantity() { return requestedQuantity; }
    public void setRequestedQuantity(BigDecimal requestedQuantity) { this.requestedQuantity = requestedQuantity; }
    public BigDecimal getApprovedQuantity() { return approvedQuantity; }
    public void setApprovedQuantity(BigDecimal approvedQuantity) { this.approvedQuantity = approvedQuantity; }
    public BigDecimal getDispatchedQuantity() { return dispatchedQuantity; }
    public void setDispatchedQuantity(BigDecimal dispatchedQuantity) { this.dispatchedQuantity = dispatchedQuantity; }
}
