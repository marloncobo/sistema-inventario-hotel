package com.hotel.inventory.repository;

import com.hotel.inventory.model.InventoryDocumentLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryDocumentLineRepository extends JpaRepository<InventoryDocumentLine, Long> {
    List<InventoryDocumentLine> findByDocument_Id(Long documentId);
}
