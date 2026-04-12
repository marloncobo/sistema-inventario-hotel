package com.lunara.masterdata.repository;

import com.lunara.masterdata.model.Unit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UnitRepository extends JpaRepository<Unit, Long> {
    boolean existsByAbbreviationIgnoreCase(String abbreviation);
}
