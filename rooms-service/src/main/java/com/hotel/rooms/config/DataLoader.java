package com.hotel.rooms.config;

import com.hotel.rooms.model.Room;
import com.hotel.rooms.repository.RoomRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DataLoader {
    @Bean
    @Order(1)
    CommandLineRunner migrateLegacyRoomSupplyAssignmentColumns(JdbcTemplate jdbcTemplate) {
        return args -> {
            if (!columnExists(jdbcTemplate, "room_supply_assignments", "room_number")) {
                return;
            }

            jdbcTemplate.update("""
                    update room_supply_assignments rsa
                    set room_number = r.number
                    from rooms r
                    where rsa.room_number is null
                      and rsa.room_id = r.id
                    """);

            jdbcTemplate.execute("alter table room_supply_assignments alter column room_number drop not null");
        };
    }

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

    private static boolean columnExists(JdbcTemplate jdbcTemplate, String tableName, String columnName) {
        Boolean exists = jdbcTemplate.queryForObject("""
                select exists (
                    select 1
                    from information_schema.columns
                    where table_schema = current_schema()
                      and table_name = ?
                      and column_name = ?
                )
                """, Boolean.class, tableName, columnName);
        return Boolean.TRUE.equals(exists);
    }
}
