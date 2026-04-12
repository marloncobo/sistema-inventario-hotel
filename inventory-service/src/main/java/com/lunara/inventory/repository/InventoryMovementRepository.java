package com.lunara.inventory.repository;

import com.lunara.inventory.model.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    List<InventoryMovement> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
    List<InventoryMovement> findByLinesProductIdOrderByCreatedAtDesc(Long productId);
}
