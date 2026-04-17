package com.hotel.inventory.repository;

import com.hotel.inventory.model.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.time.LocalDateTime;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    @Query("""
            select movement
            from InventoryMovement movement
            where (:type is null or lower(movement.movementType) = :type)
              and (:origin is null or lower(movement.origin) = :origin)
              and (:roomNumber is null or lower(movement.roomNumber) = :roomNumber)
              and (:responsible is null or lower(movement.responsible) = :responsible)
              and (:operationalResponsible is null or lower(movement.operationalResponsible) = :operationalResponsible)
              and (:areaName is null or lower(movement.areaName) = :areaName)
              and (:startDate is null or movement.createdAt >= :startDate)
              and (:endDate is null or movement.createdAt <= :endDate)
            order by movement.createdAt desc
            """)
    List<InventoryMovement> search(
            @Param("type") String type,
            @Param("origin") String origin,
            @Param("roomNumber") String roomNumber,
            @Param("responsible") String responsible,
            @Param("operationalResponsible") String operationalResponsible,
            @Param("areaName") String areaName,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
            select coalesce(sum(movement.quantity), 0)
            from InventoryMovement movement
            where movement.sourceMovementId = :sourceMovementId
              and movement.movementType = 'DEVOLUCION'
              and movement.status = 'VALIDO'
            """)
    Long returnedQuantityFor(@Param("sourceMovementId") Long sourceMovementId);

    @Query("""
            select new com.hotel.inventory.dto.TopUsedItemReport(
                movement.itemId,
                movement.itemName,
                sum(movement.quantity)
            )
            from InventoryMovement movement
            where movement.movementType = 'SALIDA'
              and movement.status = 'VALIDO'
              and (:startDate is null or movement.createdAt >= :startDate)
              and (:endDate is null or movement.createdAt <= :endDate)
            group by movement.itemId, movement.itemName
            order by sum(movement.quantity) desc
            """)
    List<com.hotel.inventory.dto.TopUsedItemReport> topUsedItems(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
