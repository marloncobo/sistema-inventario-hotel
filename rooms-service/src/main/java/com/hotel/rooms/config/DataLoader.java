package com.hotel.rooms.config;

import com.hotel.rooms.model.Room;
import com.hotel.rooms.repository.RoomRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataLoader {
    @Bean
    CommandLineRunner loadRoomsData(RoomRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                for (int floor = 1; floor <= 3; floor++) {
                    for (int number = 1; number <= 15; number++) {
                        String roomNumber = String.valueOf((floor * 100) + number);
                        String type = number % 5 == 0 ? "FAMILIAR" : number % 3 == 0 ? "EJECUTIVA" : "ESTANDAR";
                        int capacity = "FAMILIAR".equals(type) ? 4 : 2;
                        repository.save(new Room(roomNumber, type, "DISPONIBLE", capacity, floor, null));
                    }
                }
            }
        };
    }
}
