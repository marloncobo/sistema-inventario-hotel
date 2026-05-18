package com.hotel.inventory.repository;

import com.hotel.inventory.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface LocationRepository extends JpaRepository<Location, Long> {
    Optional<Location> findByCodeIgnoreCase(String code);
    Optional<Location> findByRoomNumber(String roomNumber);

    Optional<Location> findByRoomNumberAndType(String roomNumber, String type);
    boolean existsByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
    List<Location> findByActiveTrue();
    List<Location> findByTypeAndActiveTrue(String type);
    List<Location> findByType(String type);

    @Query("select l.code from Location l")
    List<String> findAllCodes();
}
