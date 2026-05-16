package com.hotel.inventory.repository;

import com.hotel.inventory.model.RoomParLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomParLineRepository extends JpaRepository<RoomParLine, Long> {
    List<RoomParLine> findByRoomPar_Id(Long roomParId);
}
