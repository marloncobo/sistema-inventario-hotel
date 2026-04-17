package com.hotel.inventory.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String action;
    @Column(nullable = false)
    private String entityName;
    private Long entityId;
    @Column(nullable = false)
    private String username;
    @Column(length = 1000)
    private String detail;
    @Column(nullable = false)
    private LocalDateTime createdAt;

    public AuditLog() {}

    public AuditLog(String action, String entityName, Long entityId, String username, String detail, LocalDateTime createdAt) {
        this.action = action;
        this.entityName = entityName;
        this.entityId = entityId;
        this.username = username;
        this.detail = detail;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getAction() { return action; }
    public String getEntityName() { return entityName; }
    public Long getEntityId() { return entityId; }
    public String getUsername() { return username; }
    public String getDetail() { return detail; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setAction(String action) { this.action = action; }
    public void setEntityName(String entityName) { this.entityName = entityName; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public void setUsername(String username) { this.username = username; }
    public void setDetail(String detail) { this.detail = detail; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
