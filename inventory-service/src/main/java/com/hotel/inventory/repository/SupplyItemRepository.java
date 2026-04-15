package com.hotel.inventory.repository;

import com.hotel.inventory.model.SupplyItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplyItemRepository extends JpaRepository<SupplyItem, Long> {
}