package com.hotel.rooms.repository;

import com.hotel.rooms.model.RoomSupplyAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RoomSupplyAssignmentRepository extends JpaRepository<RoomSupplyAssignment, Long> {
    List<RoomSupplyAssignment> findByRoomId(Long roomId);

    @Query("""
            select assignment
            from RoomSupplyAssignment assignment
            where (:roomNumber is null or lower(assignment.roomNumber) = :roomNumber)
              and (:assignmentType is null or lower(assignment.assignmentType) = :assignmentType)
              and (:startDate is null or assignment.createdAt >= :startDate)
              and (:endDate is null or assignment.createdAt <= :endDate)
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
                assignment.roomNumber,
                room.type,
                assignment.itemId,
                assignment.itemName,
                assignment.assignmentType,
                assignment.deliveredBy,
                sum(assignment.quantity)
            )
            from RoomSupplyAssignment assignment
            join Room room on room.id = assignment.roomId
            where (:roomNumber is null or lower(assignment.roomNumber) = :roomNumber)
              and (:roomType is null or lower(room.type) = :roomType)
              and (:assignmentType is null or lower(assignment.assignmentType) = :assignmentType)
              and (:startDate is null or assignment.createdAt >= :startDate)
              and (:endDate is null or assignment.createdAt <= :endDate)
            group by assignment.roomNumber, room.type, assignment.itemId, assignment.itemName, assignment.assignmentType, assignment.deliveredBy
            order by assignment.roomNumber asc, sum(assignment.quantity) desc
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
                assignment.roomNumber,
                room.type,
                assignment.itemId,
                assignment.itemName,
                assignment.quantity,
                assignment.assignmentType,
                assignment.deliveredBy,
                assignment.guestName,
                assignment.createdAt
            )
            from RoomSupplyAssignment assignment
            join Room room on room.id = assignment.roomId
            where (:roomNumber is null or lower(assignment.roomNumber) = :roomNumber)
              and (:roomType is null or lower(room.type) = :roomType)
              and (:assignmentType is null or lower(assignment.assignmentType) = :assignmentType)
              and (:deliveredBy is null or lower(assignment.deliveredBy) = :deliveredBy)
              and (:startDate is null or assignment.createdAt >= :startDate)
              and (:endDate is null or assignment.createdAt <= :endDate)
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
