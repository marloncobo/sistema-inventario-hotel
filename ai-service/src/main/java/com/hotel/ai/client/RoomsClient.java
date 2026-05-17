package com.hotel.ai.client;

import com.hotel.ai.dto.RoomConsumptionDto;
import com.hotel.ai.dto.RoomDistributionDto;
import com.hotel.ai.dto.RoomDto;

import java.time.LocalDate;
import java.util.List;

public interface RoomsClient {
    List<RoomDto> listRooms();

    List<RoomConsumptionDto> consumptionReport(LocalDate startDate, LocalDate endDate);

    List<RoomDistributionDto> distributionReport(LocalDate startDate, LocalDate endDate);
}
