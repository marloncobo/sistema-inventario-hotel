package com.hotel.inventory.repository;

import com.hotel.inventory.model.InventoryDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryDocumentRepository extends JpaRepository<InventoryDocument, Long> {

    @Query("select d from InventoryDocument d left join fetch d.lines where d.id = :id")
    Optional<InventoryDocument> findByIdWithLines(@Param("id") Long id);

    Optional<InventoryDocument> findByCodeIgnoreCase(String code);

    List<InventoryDocument> findByType(String type);

    List<InventoryDocument> findByStatus(String status);

    List<InventoryDocument> findByTypeAndStatus(String type, String status);

    @Query("select max(d.code) from InventoryDocument d where d.type = ?1")
    Optional<String> findMaxCodeByType(String type);
}
