package com.hotel.inventory.repository;

import com.hotel.inventory.model.Provider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProviderRepository extends JpaRepository<Provider, Long> {
    boolean existsByDocumentNumberIgnoreCase(String documentNumber);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByDocumentNumberIgnoreCaseAndIdNot(String documentNumber, Long id);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    Optional<Provider> findByNameIgnoreCase(String name);
}
