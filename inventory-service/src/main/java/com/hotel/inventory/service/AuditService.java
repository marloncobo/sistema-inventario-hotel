package com.hotel.inventory.service;

import com.hotel.inventory.model.AuditLog;
import com.hotel.inventory.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class AuditService {
    private static final LocalDateTime MIN_DATE = LocalDateTime.of(1900, 1, 1, 0, 0);
    private static final LocalDateTime MAX_DATE = LocalDateTime.of(9999, 12, 31, 23, 59, 59);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(String action, String entityName, Long entityId, String username, String detail) {
        auditLogRepository.save(new AuditLog(action, entityName, entityId, username, detail, LocalDateTime.now()));
    }

    public List<AuditLog> list(String action, String username, LocalDate startDate, LocalDate endDate) {
        return auditLogRepository.search(
                blankToWildcardLower(action),
                blankToWildcardLower(username),
                startDate == null ? MIN_DATE : startDate.atStartOfDay(),
                endDate == null ? MAX_DATE : endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
    }

    private String blankToWildcardLower(String value) {
        return value == null || value.isBlank() ? "%" : value.trim().toLowerCase(Locale.ROOT);
    }
}
