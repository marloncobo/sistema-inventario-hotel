package com.hotel.gateway.auth;

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
}
