package com.lunara.inventory.repository;

import com.lunara.inventory.model.InventoryMovementLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface InventoryMovementLineRepository extends JpaRepository<InventoryMovementLine, Long> {
    List<InventoryMovementLine> findByExpirationDateBetween(LocalDate from, LocalDate to);
}
