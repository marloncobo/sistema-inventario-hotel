package com.hotel.inventory.client;

import com.hotel.inventory.dto.RoomValidationResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class RestClientRoomClient implements RoomClient {
    private final RestClient roomsRestClient;

    public RestClientRoomClient(RestClient roomsRestClient) {
        this.roomsRestClient = roomsRestClient;
    }

    @Override
    public RoomValidationResponse getRoomByNumber(String roomNumber) {
        return roomsRestClient.get()
                .uri("/api/rooms/number/{roomNumber}", roomNumber)
                .retrieve()
                .body(RoomValidationResponse.class);
    }
}
