package com.hotel.rooms.repository;

import com.hotel.rooms.model.RoomSupplyAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RoomSupplyAssignmentRepository extends JpaRepository<RoomSupplyAssignment, Long> {
    @Query("""
            select assignment
            from RoomSupplyAssignment assignment
            where assignment.room.id = :roomId
            order by assignment.createdAt desc
            """)
    List<RoomSupplyAssignment> findByRoomId(@Param("roomId") Long roomId);

    @Query("""
            select assignment
            from RoomSupplyAssignment assignment
            where lower(assignment.room.number) like :roomNumber
              and lower(assignment.assignmentType) like :assignmentType
              and assignment.createdAt between :startDate and :endDate
            order by assignment.createdAt desc
            """)
    List<RoomSupplyAssignment> search(
            @Param("roomNumber") String roomNumber,
            @Param("assignmentType") String assignmentType,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
            select new com.hotel.rooms.dto.RoomConsumptionReport(
                assignment.room.number,
                assignment.room.type,
                assignment.itemId,
                assignment.itemName,
                assignment.assignmentType,
                assignment.deliveredBy,
                sum(assignment.quantity)
            )
            from RoomSupplyAssignment assignment
            where lower(assignment.room.number) like :roomNumber
              and lower(assignment.room.type) like :roomType
              and lower(assignment.assignmentType) like :assignmentType
              and assignment.createdAt between :startDate and :endDate
            group by assignment.room.number, assignment.room.type, assignment.itemId, assignment.itemName, assignment.assignmentType, assignment.deliveredBy
            order by assignment.room.number asc, sum(assignment.quantity) desc
            """)
    List<com.hotel.rooms.dto.RoomConsumptionReport> consumptionReport(
            @Param("roomNumber") String roomNumber,
            @Param("roomType") String roomType,
            @Param("assignmentType") String assignmentType,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
            select new com.hotel.rooms.dto.RoomDistributionReport(
                assignment.room.number,
                assignment.room.type,
                assignment.itemId,
                assignment.itemName,
                assignment.quantity,
                assignment.assignmentType,
                assignment.deliveredBy,
                assignment.guestName,
                assignment.createdAt
            )
            from RoomSupplyAssignment assignment
            where lower(assignment.room.number) like :roomNumber
              and lower(assignment.room.type) like :roomType
              and lower(assignment.assignmentType) like :assignmentType
              and lower(assignment.deliveredBy) like :deliveredBy
              and assignment.createdAt between :startDate and :endDate
            order by assignment.createdAt desc
            """)
    List<com.hotel.rooms.dto.RoomDistributionReport> distributionReport(
            @Param("roomNumber") String roomNumber,
            @Param("roomType") String roomType,
            @Param("assignmentType") String assignmentType,
            @Param("deliveredBy") String deliveredBy,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
