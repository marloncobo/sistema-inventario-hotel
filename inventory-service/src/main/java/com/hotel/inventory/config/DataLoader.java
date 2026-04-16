package com.hotel.inventory.config;

import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.repository.SupplyItemRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataLoader {
    @Bean
    CommandLineRunner loadInventoryData(SupplyItemRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(new SupplyItem("MIN-001", "Agua embotellada 600ml", "Agua para minibar", "MINIBAR", "UND", "Aseo Premium SAS", 30, 10, 120, true));
                repository.save(new SupplyItem("ASE-001", "Shampoo individual", "Amenidad para huesped", "ASEO", "UND", "Distribuciones Hoteleras SAS", 50, 15, 200, true));
                repository.save(new SupplyItem("LEN-001", "Toalla facial", "Lenceria de habitacion", "LENCERIA", "UND", "Distribuciones Hoteleras SAS", 40, 12, 100, true));
            }
        };
    }
}
