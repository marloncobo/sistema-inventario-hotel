package com.hotel.inventory.repository;

import com.hotel.inventory.model.RoomPar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomParRepository extends JpaRepository<RoomPar, Long> {
    Optional<RoomPar> findByRoomTypeAndScopeAndActiveTrue(String roomType, String scope);

    @Query("select distinct p from RoomPar p left join fetch p.lines where p.active = true")
    List<RoomPar> findActiveWithLines();

    @Query("select distinct p from RoomPar p left join fetch p.lines")
    List<RoomPar> findAllWithLines();

    @Query("select p from RoomPar p left join fetch p.lines where p.id = :id")
    Optional<RoomPar> findByIdWithLines(@Param("id") Long id);

    List<RoomPar> findByActiveTrue();
    List<RoomPar> findByRoomTypeAndActiveTrue(String roomType);
    boolean existsByRoomTypeAndScopeIgnoreCaseAndIdNot(String roomType, String scope, Long id);
    boolean existsByRoomTypeAndScopeIgnoreCase(String roomType, String scope);
}
