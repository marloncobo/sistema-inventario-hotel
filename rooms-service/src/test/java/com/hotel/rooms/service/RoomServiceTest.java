package com.hotel.rooms.service;

import com.hotel.rooms.client.InventoryClient;
import com.hotel.rooms.dto.AssignSupplyRequest;
import com.hotel.rooms.dto.CreateRoomRequest;
import com.hotel.rooms.dto.InventoryItemResponse;
import com.hotel.rooms.dto.StockChangeResponse;
import com.hotel.rooms.exception.BusinessException;
import com.hotel.rooms.exception.NotFoundException;
import com.hotel.rooms.model.Room;
import com.hotel.rooms.model.RoomSupplyAssignment;
import com.hotel.rooms.repository.RoomRepository;
import com.hotel.rooms.repository.RoomSupplyAssignmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {
    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomSupplyAssignmentRepository assignmentRepository;

    @Mock
    private InventoryClient inventoryClient;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private RoomService roomService;

    @Test
    void createRoomSavesRoomFromRequest() {
        when(roomRepository.existsByNumber("201")).thenReturn(false);
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> {
            Room room = invocation.getArgument(0);
            room.setId(15L);
            return room;
        });

        Room created = roomService.createRoom(new CreateRoomRequest("201", "Estandar", "Disponible", 2, 2, null), "admin");

        assertThat(created.getId()).isEqualTo(15L);
        assertThat(created.getNumber()).isEqualTo("201");
        assertThat(created.getType()).isEqualTo("ESTANDAR");
        assertThat(created.getStatus()).isEqualTo("DISPONIBLE");
        assertThat(created.getCapacity()).isEqualTo(2);
        assertThat(created.getFloor()).isEqualTo(2);
    }

    @Test
    void createRoomThrowsBusinessExceptionWhenNumberAlreadyExists() {
        when(roomRepository.existsByNumber("201")).thenReturn(true);

        assertThatThrownBy(() -> roomService.createRoom(new CreateRoomRequest("201", "Estandar", "Disponible", 2, 2, null), "admin"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("201");

        verify(roomRepository, never()).save(any());
    }

    @Test
    void updateRoomPersistsEditedFields() {
        Room existing = room(15L, "201");
        when(roomRepository.findById(15L)).thenReturn(Optional.of(existing));
        when(roomRepository.existsByNumberAndIdNot("305", 15L)).thenReturn(false);
        when(roomRepository.save(existing)).thenReturn(existing);

        Room updated = roomService.updateRoom(
                15L,
                new CreateRoomRequest("305", "Familiar", "En limpieza", 4, 3, "Vista al jardin"),
                "admin"
        );

        assertThat(updated.getNumber()).isEqualTo("305");
        assertThat(updated.getType()).isEqualTo("FAMILIAR");
        assertThat(updated.getStatus()).isEqualTo("EN_LIMPIEZA");
        assertThat(updated.getCapacity()).isEqualTo(4);
        assertThat(updated.getFloor()).isEqualTo(3);
        assertThat(updated.getObservations()).isEqualTo("Vista al jardin");
    }

    @Test
    void updateRoomThrowsBusinessExceptionWhenNumberAlreadyExistsInAnotherRoom() {
        Room existing = room(15L, "201");
        when(roomRepository.findById(15L)).thenReturn(Optional.of(existing));
        when(roomRepository.existsByNumberAndIdNot("305", 15L)).thenReturn(true);

        assertThatThrownBy(() -> roomService.updateRoom(
                15L,
                new CreateRoomRequest("305", "Estandar", "Disponible", 2, 3, null),
                "admin"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("305");

        verify(roomRepository, never()).save(any());
    }

    @Test
    void getRoomThrowsNotFoundExceptionWhenRoomDoesNotExist() {
        when(roomRepository.findById(88L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roomService.getRoom(88L))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("88");
    }

    @Test
    void assignSupplyDiscountsInventoryAndStoresAssignment() {
        Room room = room(5L, "305");
        when(roomRepository.findById(5L)).thenReturn(Optional.of(room));
        when(inventoryClient.getItem(9L))
                .thenReturn(new InventoryItemResponse(9L, "ASE-001", "Toallas", "ASEO", "UND", 13, true));
        when(inventoryClient.decreaseStock(any()))
                .thenReturn(new StockChangeResponse(9L, "Toallas", 11, "ok"));
        when(assignmentRepository.save(any(RoomSupplyAssignment.class))).thenAnswer(invocation -> {
            RoomSupplyAssignment assignment = invocation.getArgument(0);
            assignment.setId(33L);
            return assignment;
        });

        RoomSupplyAssignment assignment = roomService.assignSupply(
                5L,
                new AssignSupplyRequest(9L, 2, "Camila", "Huesped", "KIT_ASEO"),
                "camila"
        );

        assertThat(assignment.getId()).isEqualTo(33L);
        assertThat(assignment.getRoomId()).isEqualTo(5L);
        assertThat(assignment.getRoomNumber()).isEqualTo("305");
        assertThat(assignment.getItemId()).isEqualTo(9L);
        assertThat(assignment.getItemName()).isEqualTo("Toallas");
        assertThat(assignment.getQuantity()).isEqualTo(2);
        assertThat(assignment.getDeliveredBy()).isEqualTo("Camila");
        assertThat(assignment.getGuestName()).isEqualTo("Huesped");
        assertThat(assignment.getAssignmentType()).isEqualTo("KIT_ASEO");
        assertThat(assignment.getCreatedAt()).isNotNull();
    }

    @Test
    void assignSupplyThrowsBusinessExceptionWhenInventoryReturnsNoBody() {
        Room room = room(6L, "401");
        when(roomRepository.findById(6L)).thenReturn(Optional.of(room));
        when(inventoryClient.getItem(2L))
                .thenReturn(new InventoryItemResponse(2L, "MIN-001", "Agua", "MINIBAR", "UND", 20, true));
        when(inventoryClient.decreaseStock(any())).thenReturn(null);

        assertThatThrownBy(() -> roomService.assignSupply(
                6L,
                new AssignSupplyRequest(2L, 1, "Daniel", null, null),
                "daniel"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No hubo respuesta");

        verify(assignmentRepository, never()).save(any());
    }

    @Test
    void getRoomAssignmentsRequiresExistingRoomAndReturnsAssignments() {
        Room room = room(7L, "102");
        RoomSupplyAssignment assignment = new RoomSupplyAssignment(
                room, 4L, "Jabon", 3, "Laura", null, java.time.LocalDateTime.now()
        );
        when(roomRepository.findById(7L)).thenReturn(Optional.of(room));
        when(assignmentRepository.findByRoomId(7L)).thenReturn(List.of(assignment));

        List<RoomSupplyAssignment> assignments = roomService.getRoomAssignments(7L);

        assertThat(assignments).containsExactly(assignment);
        verify(assignmentRepository).findByRoomId(7L);
    }

    @Test
    void assignSupplyDoesNotCallInventoryWhenRoomDoesNotExist() {
        when(roomRepository.findById(40L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roomService.assignSupply(
                40L,
                new AssignSupplyRequest(3L, 1, "Nora", null, null),
                "nora"
        ))
                .isInstanceOf(NotFoundException.class);

        verify(inventoryClient, never()).decreaseStock(any());
        verify(assignmentRepository, never()).save(any());
    }

    private static Room room(Long id, String number) {
        Room room = new Room(number, "Suite", "Disponible", 3);
        room.setId(id);
        return room;
    }
}
