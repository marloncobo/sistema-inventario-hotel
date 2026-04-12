package com.lunara.inventory.repository;

import com.lunara.inventory.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {
    List<Stock> findByProductId(Long productId);
    List<Stock> findByWarehouseId(Long warehouseId);
    Optional<Stock> findByProductIdAndWarehouseId(Long productId, Long warehouseId);
}
