package com.lunara.masterdata.repository;

import com.lunara.masterdata.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    boolean existsByTaxIdIgnoreCase(String taxId);
}
