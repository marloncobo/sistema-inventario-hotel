package com.hotel.gateway.auth;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class AuditService {
    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(String action, String entityName, Long entityId, String username, String detail) {
        auditLogRepository.save(new AuditLog(action, entityName, entityId, username, detail, LocalDateTime.now()));
    }

    public List<AuditLog> list(String action, String username, LocalDate startDate, LocalDate endDate) {
        return auditLogRepository.search(
                blankToNullLower(action),
                blankToNullLower(username),
                startDate == null ? null : startDate.atStartOfDay(),
                endDate == null ? null : endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
    }

    private String blankToNullLower(String value) {
        return value == null || value.isBlank() ? null : value.trim().toLowerCase(Locale.ROOT);
    }
}
