package com.lunara.masterdata.repository;

import com.lunara.masterdata.model.Area;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AreaRepository extends JpaRepository<Area, Long> {
    boolean existsByNameIgnoreCase(String name);
}
