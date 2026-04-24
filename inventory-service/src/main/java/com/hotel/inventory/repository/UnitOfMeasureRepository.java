package com.hotel.inventory.repository;

import com.hotel.inventory.model.UnitOfMeasure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UnitOfMeasureRepository extends JpaRepository<UnitOfMeasure, Long> {
    boolean existsByCodeIgnoreCase(String code);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByAbbreviationIgnoreCase(String abbreviation);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    boolean existsByAbbreviationIgnoreCaseAndIdNot(String abbreviation, Long id);
    Optional<UnitOfMeasure> findByCodeIgnoreCase(String code);
    Optional<UnitOfMeasure> findByAbbreviationIgnoreCase(String abbreviation);
    @Query("select u.code from UnitOfMeasure u")
    List<String> findAllCodes();
}
