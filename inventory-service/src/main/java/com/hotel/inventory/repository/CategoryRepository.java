package com.hotel.inventory.repository;

import com.hotel.inventory.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByCodeIgnoreCase(String code);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    Optional<Category> findByCodeIgnoreCase(String code);
    Optional<Category> findByNameIgnoreCase(String name);
}
