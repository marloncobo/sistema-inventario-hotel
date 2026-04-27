package com.hotel.inventory.repository;

import com.hotel.inventory.model.LowStockAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LowStockAlertRepository extends JpaRepository<LowStockAlert, Long> {
    @Query("""
            select alert
            from LowStockAlert alert
            where alert.item.id = :itemId
              and alert.status = :status
            """)
    Optional<LowStockAlert> findByItemIdAndStatus(@Param("itemId") Long itemId, @Param("status") String status);
    List<LowStockAlert> findByStatusOrderByCreatedAtDesc(String status);
    List<LowStockAlert> findAllByOrderByCreatedAtDesc();
}
