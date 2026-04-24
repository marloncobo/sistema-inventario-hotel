package com.hotel.rooms.repository;

import com.hotel.rooms.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    boolean existsByNumber(String number);
    boolean existsByNumberAndIdNot(String number, Long id);
    long countByActiveTrue();
    Optional<Room> findByNumber(String number);
}
