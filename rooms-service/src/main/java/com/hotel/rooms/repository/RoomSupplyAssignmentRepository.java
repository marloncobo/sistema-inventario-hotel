package com.hotel.rooms.repository;

import com.hotel.rooms.model.RoomSupplyAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomSupplyAssignmentRepository extends JpaRepository<RoomSupplyAssignment, Long> {
    List<RoomSupplyAssignment> findByRoomId(Long roomId);
}