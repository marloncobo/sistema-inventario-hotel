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
                repository.save(new SupplyItem("Agua embotellada 600ml", "MINIBAR", "UND", 30, 10, true));
                repository.save(new SupplyItem("Shampoo individual", "ASEO", "UND", 50, 15, true));
                repository.save(new SupplyItem("Toalla facial", "LENCERIA", "UND", 40, 12, true));
            }
        };
    }
}