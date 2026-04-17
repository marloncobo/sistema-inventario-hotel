package com.hotel.inventory.repository;

import com.hotel.inventory.model.LowStockAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LowStockAlertRepository extends JpaRepository<LowStockAlert, Long> {
    Optional<LowStockAlert> findByItemIdAndStatus(Long itemId, String status);
    List<LowStockAlert> findByStatusOrderByCreatedAtDesc(String status);
    List<LowStockAlert> findAllByOrderByCreatedAtDesc();
}
