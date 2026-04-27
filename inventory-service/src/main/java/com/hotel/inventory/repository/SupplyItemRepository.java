package com.hotel.inventory.repository;

import com.hotel.inventory.model.SupplyItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SupplyItemRepository extends JpaRepository<SupplyItem, Long> {
    boolean existsByCodeIgnoreCase(String code);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    @Query("""
            select item
            from SupplyItem item
            where lower(item.category.code) = :category
               or lower(item.category.name) = :category
            """)
    List<SupplyItem> findByCategory(@Param("category") String category);

    @Query("select item from SupplyItem item where item.stock <= item.minStock")
    List<SupplyItem> findLowStockItems();

    @Query("select item.code from SupplyItem item")
    List<String> findAllCodes();
}
