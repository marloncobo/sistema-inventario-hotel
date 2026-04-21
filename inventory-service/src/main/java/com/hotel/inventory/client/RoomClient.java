package com.hotel.inventory.client;

import com.hotel.inventory.dto.RoomValidationResponse;

public interface RoomClient {
    RoomValidationResponse getRoomByNumber(String roomNumber);
}
