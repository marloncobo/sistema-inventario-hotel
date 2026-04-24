package com.hotel.inventory.repository;

import com.hotel.inventory.model.Provider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProviderRepository extends JpaRepository<Provider, Long> {
    boolean existsByCodeIgnoreCase(String code);
    boolean existsByDocumentNumberIgnoreCase(String documentNumber);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
    boolean existsByDocumentNumberIgnoreCaseAndIdNot(String documentNumber, Long id);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    Optional<Provider> findByNameIgnoreCase(String name);
    @Query("select p.code from Provider p")
    List<String> findAllCodes();
}
