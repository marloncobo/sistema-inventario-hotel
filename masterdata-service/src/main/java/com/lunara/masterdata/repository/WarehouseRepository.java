package com.lunara.masterdata.repository;

import com.lunara.masterdata.model.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    boolean existsByNameIgnoreCase(String name);
}
