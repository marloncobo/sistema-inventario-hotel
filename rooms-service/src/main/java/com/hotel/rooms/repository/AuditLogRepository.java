package com.hotel.rooms.repository;

import com.hotel.rooms.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("""
            select log
            from AuditLog log
            where (:action is null or lower(log.action) = :action)
              and (:username is null or lower(log.username) = :username)
              and (:startDate is null or log.createdAt >= :startDate)
              and (:endDate is null or log.createdAt <= :endDate)
            order by log.createdAt desc
            """)
    List<AuditLog> search(
            @Param("action") String action,
            @Param("username") String username,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
