package com.lunara.inventory.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "internal_requests")
public class InternalRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "request_number", nullable = false, unique = true, length = 30)
    private String requestNumber;
    @Column(name = "area_id", nullable = false)
    private Long areaId;
    @Column(name = "area_name", nullable = false, length = 80)
    private String areaName;
    @Column(name = "requested_by", nullable = false, length = 60)
    private String requestedBy;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private InternalRequestStatus status;
    @Column(length = 500)
    private String observations;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @JsonManagedReference
    @OneToMany(mappedBy = "internalRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InternalRequestLine> lines = new ArrayList<InternalRequestLine>();
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRequestNumber() { return requestNumber; }
    public void setRequestNumber(String requestNumber) { this.requestNumber = requestNumber; }
    public Long getAreaId() { return areaId; }
    public void setAreaId(Long areaId) { this.areaId = areaId; }
    public String getAreaName() { return areaName; }
    public void setAreaName(String areaName) { this.areaName = areaName; }
    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }
    public InternalRequestStatus getStatus() { return status; }
    public void setStatus(InternalRequestStatus status) { this.status = status; }
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<InternalRequestLine> getLines() { return lines; }
    public void setLines(List<InternalRequestLine> lines) { this.lines = lines; }
}
