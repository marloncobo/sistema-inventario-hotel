package com.hotel.ai.client;

import com.hotel.ai.dto.AppUserDto;

import java.util.List;

public interface GatewayClient {
    List<AppUserDto> listUsers();
}
