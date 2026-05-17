package com.hotel.ai.client;

import com.hotel.ai.dto.RoomConsumptionDto;
import com.hotel.ai.dto.RoomDistributionDto;
import com.hotel.ai.dto.RoomDto;
import com.hotel.ai.exception.ExternalServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDate;
import java.util.List;

@Component
public class RestClientRoomsClient implements RoomsClient {
    private static final Logger log = LoggerFactory.getLogger(RestClientRoomsClient.class);
    private static final ParameterizedTypeReference<List<RoomDto>> ROOM_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<List<RoomConsumptionDto>> ROOM_CONSUMPTION_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<List<RoomDistributionDto>> ROOM_DISTRIBUTION_LIST_TYPE = new ParameterizedTypeReference<>() {
    };

    private final RestClient roomsRestClient;

    public RestClientRoomsClient(@Qualifier("roomsRestClient") RestClient roomsRestClient) {
        this.roomsRestClient = roomsRestClient;
    }

    @Override
    public List<RoomDto> listRooms() {
        return optionalList("/api/rooms", ROOM_LIST_TYPE, "habitaciones");
    }

    @Override
    public List<RoomConsumptionDto> consumptionReport(LocalDate startDate, LocalDate endDate) {
        return optionalList("/api/rooms/reports/consumption?startDate={startDate}&endDate={endDate}",
                ROOM_CONSUMPTION_LIST_TYPE, "consumo de habitaciones", startDate, endDate);
    }

    @Override
    public List<RoomDistributionDto> distributionReport(LocalDate startDate, LocalDate endDate) {
        return optionalList("/api/rooms/reports/distribution?startDate={startDate}&endDate={endDate}",
                ROOM_DISTRIBUTION_LIST_TYPE, "distribucion de habitaciones", startDate, endDate);
    }

    private <T> List<T> optionalList(String uri, ParameterizedTypeReference<List<T>> type, String label, Object... uriVariables) {
        try {
            List<T> body = roomsRestClient.get()
                    .uri(uri, uriVariables)
                    .retrieve()
                    .body(type);
            return body == null ? List.of() : body;
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().equals(HttpStatusCode.valueOf(403))
                    || ex.getStatusCode().equals(HttpStatusCode.valueOf(401))
                    || ex.getStatusCode().is5xxServerError()) {
                log.warn("Omitting optional rooms block '{}' because rooms-service responded {} {}", label, ex.getStatusCode().value(), ex.getStatusText());
                return List.of();
            }
            throw new ExternalServiceException("rooms-service rechazo la consulta de " + label + ": " + ex.getStatusCode().value() + " " + ex.getStatusText(), ex);
        } catch (ResourceAccessException ex) {
            throw new ExternalServiceException("No fue posible conectar con rooms-service para obtener " + label, ex);
        }
    }
}
