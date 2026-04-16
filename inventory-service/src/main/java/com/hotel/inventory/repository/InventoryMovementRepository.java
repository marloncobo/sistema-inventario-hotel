package com.hotel.inventory.repository;

import com.hotel.inventory.model.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    @Query("""
            select movement
            from InventoryMovement movement
            where (:type is null or lower(movement.movementType) = :type)
              and (:origin is null or lower(movement.origin) = :origin)
              and (:roomNumber is null or lower(movement.roomNumber) = :roomNumber)
              and (:responsible is null or lower(movement.responsible) = :responsible)
            order by movement.createdAt desc
            """)
    List<InventoryMovement> search(
            @Param("type") String type,
            @Param("origin") String origin,
            @Param("roomNumber") String roomNumber,
            @Param("responsible") String responsible
    );
}
