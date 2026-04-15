package com.hotel.rooms.service;

import com.hotel.rooms.dto.AssignSupplyRequest;
import com.hotel.rooms.dto.CreateRoomRequest;
import com.hotel.rooms.dto.StockChangeResponse;
import com.hotel.rooms.exception.BusinessException;
import com.hotel.rooms.exception.NotFoundException;
import com.hotel.rooms.model.Room;
import com.hotel.rooms.model.RoomSupplyAssignment;
import com.hotel.rooms.repository.RoomRepository;
import com.hotel.rooms.repository.RoomSupplyAssignmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

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

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private RestClient inventoryRestClient;

    @InjectMocks
    private RoomService roomService;

    @Test
    void createRoomSavesRoomFromRequest() {
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> {
            Room room = invocation.getArgument(0);
            room.setId(15L);
            return room;
        });

        Room created = roomService.createRoom(new CreateRoomRequest("201", "Doble", "Disponible", 2));

        assertThat(created.getId()).isEqualTo(15L);
        assertThat(created.getNumber()).isEqualTo("201");
        assertThat(created.getType()).isEqualTo("Doble");
        assertThat(created.getStatus()).isEqualTo("Disponible");
        assertThat(created.getFloor()).isEqualTo(2);
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
        when(inventoryRestClient.post()
                .uri("/api/inventory/internal/items/decrease")
                .body(any())
                .retrieve()
                .body(StockChangeResponse.class))
                .thenReturn(new StockChangeResponse(9L, "Toallas", 11, "ok"));
        when(assignmentRepository.save(any(RoomSupplyAssignment.class))).thenAnswer(invocation -> {
            RoomSupplyAssignment assignment = invocation.getArgument(0);
            assignment.setId(33L);
            return assignment;
        });

        RoomSupplyAssignment assignment = roomService.assignSupply(
                5L,
                new AssignSupplyRequest(9L, 2, "Camila", "Huesped")
        );

        assertThat(assignment.getId()).isEqualTo(33L);
        assertThat(assignment.getRoomId()).isEqualTo(5L);
        assertThat(assignment.getRoomNumber()).isEqualTo("305");
        assertThat(assignment.getItemId()).isEqualTo(9L);
        assertThat(assignment.getItemName()).isEqualTo("Toallas");
        assertThat(assignment.getQuantity()).isEqualTo(2);
        assertThat(assignment.getDeliveredBy()).isEqualTo("Camila");
        assertThat(assignment.getGuestName()).isEqualTo("Huesped");
        assertThat(assignment.getCreatedAt()).isNotNull();
    }

    @Test
    void assignSupplyThrowsBusinessExceptionWhenInventoryReturnsNoBody() {
        Room room = room(6L, "401");
        when(roomRepository.findById(6L)).thenReturn(Optional.of(room));
        when(inventoryRestClient.post()
                .uri("/api/inventory/internal/items/decrease")
                .body(any())
                .retrieve()
                .body(StockChangeResponse.class))
                .thenReturn(null);

        assertThatThrownBy(() -> roomService.assignSupply(
                6L,
                new AssignSupplyRequest(2L, 1, "Daniel", null)
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No hubo respuesta");

        verify(assignmentRepository, never()).save(any());
    }

    @Test
    void getRoomAssignmentsRequiresExistingRoomAndReturnsAssignments() {
        Room room = room(7L, "102");
        RoomSupplyAssignment assignment = new RoomSupplyAssignment(
                7L, "102", 4L, "Jabon", 3, "Laura", null, java.time.LocalDateTime.now()
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
                new AssignSupplyRequest(3L, 1, "Nora", null)
        ))
                .isInstanceOf(NotFoundException.class);

        verify(inventoryRestClient, never()).post();
        verify(assignmentRepository, never()).save(any());
    }

    private static Room room(Long id, String number) {
        Room room = new Room(number, "Suite", "Disponible", 3);
        room.setId(id);
        return room;
    }
}
