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
            left join movement.area area
            where lower(movement.movementType) like :type
              and lower(movement.origin) like :origin
              and coalesce(lower(movement.roomNumber), '') like :roomNumber
              and lower(movement.responsible) like :responsible
              and coalesce(lower(movement.operationalResponsible), '') like :operationalResponsible
              and coalesce(lower(area.name), '') like :areaName
              and movement.createdAt between :startDate and :endDate
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
            where movement.sourceMovement.id = :sourceMovementId
              and movement.movementType = 'DEVOLUCION'
              and movement.status = 'VALIDO'
            """)
    Long returnedQuantityFor(@Param("sourceMovementId") Long sourceMovementId);

    @Query("""
            select new com.hotel.inventory.dto.TopUsedItemReport(
                movement.item.id,
                movement.item.name,
                sum(movement.quantity)
            )
            from InventoryMovement movement
            where movement.movementType = 'SALIDA'
              and movement.status = 'VALIDO'
              and movement.createdAt between :startDate and :endDate
            group by movement.item.id, movement.item.name
            order by sum(movement.quantity) desc
            """)
    List<com.hotel.inventory.dto.TopUsedItemReport> topUsedItems(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
