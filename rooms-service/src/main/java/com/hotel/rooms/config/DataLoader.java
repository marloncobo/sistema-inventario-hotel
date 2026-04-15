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
                repository.save(new Room("101", "ESTANDAR", "DISPONIBLE", 1));
                repository.save(new Room("102", "EJECUTIVA", "OCUPADA", 1));
                repository.save(new Room("201", "FAMILIAR", "DISPONIBLE", 2));
            }
        };
    }
}