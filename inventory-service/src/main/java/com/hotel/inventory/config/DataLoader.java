package com.hotel.inventory.config;

import com.hotel.inventory.model.Area;
import com.hotel.inventory.model.Category;
import com.hotel.inventory.model.Provider;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.model.UnitOfMeasure;
import com.hotel.inventory.repository.AreaRepository;
import com.hotel.inventory.repository.CategoryRepository;
import com.hotel.inventory.repository.ProviderRepository;
import com.hotel.inventory.repository.SupplyItemRepository;
import com.hotel.inventory.repository.UnitOfMeasureRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataLoader {
    @Bean
    CommandLineRunner loadInventoryData(SupplyItemRepository repository, CategoryRepository categoryRepository,
                                        UnitOfMeasureRepository unitRepository, ProviderRepository providerRepository,
                                        AreaRepository areaRepository) {
        return args -> {
            if (categoryRepository.count() == 0) {
                categoryRepository.save(new Category("MINIBAR", "MINIBAR", true));
                categoryRepository.save(new Category("ASEO", "ASEO", true));
                categoryRepository.save(new Category("LENCERIA", "LENCERIA", true));
                categoryRepository.save(new Category("ALIMENTOS", "ALIMENTOS", true));
            }
            if (unitRepository.count() == 0) {
                unitRepository.save(new UnitOfMeasure("UND", "UNIDAD", "UND", true));
                unitRepository.save(new UnitOfMeasure("CAJA", "CAJA", "CJ", true));
                unitRepository.save(new UnitOfMeasure("LITRO", "LITRO", "LT", true));
            }
            if (providerRepository.count() == 0) {
                providerRepository.save(new Provider("900001001", "Aseo Premium SAS", null, null, true));
                providerRepository.save(new Provider("900001002", "Distribuciones Hoteleras SAS", null, null, true));
            }
            if (areaRepository.count() == 0) {
                areaRepository.save(new Area("LIMPIEZA", "LIMPIEZA", true));
                areaRepository.save(new Area("RESTAURANTE", "RESTAURANTE", true));
                areaRepository.save(new Area("MANTENIMIENTO", "MANTENIMIENTO", true));
            }
            if (repository.count() == 0) {
                Category minibar = categoryRepository.findByCodeIgnoreCase("MINIBAR").orElseThrow();
                Category aseo = categoryRepository.findByCodeIgnoreCase("ASEO").orElseThrow();
                Category lenceria = categoryRepository.findByCodeIgnoreCase("LENCERIA").orElseThrow();
                UnitOfMeasure unit = unitRepository.findByCodeIgnoreCase("UND").orElseThrow();
                Provider aseoProvider = providerRepository.findByNameIgnoreCase("Aseo Premium SAS").orElseThrow();
                Provider hotelProvider = providerRepository.findByNameIgnoreCase("Distribuciones Hoteleras SAS").orElseThrow();

                repository.save(new SupplyItem("MIN-001", "Agua embotellada 600ml", "Agua para minibar", minibar, unit, aseoProvider, 30, 10, 120, true));
                repository.save(new SupplyItem("ASE-001", "Shampoo individual", "Amenidad para huesped", aseo, unit, hotelProvider, 50, 15, 200, true));
                repository.save(new SupplyItem("LEN-001", "Toalla facial", "Lenceria de habitacion", lenceria, unit, hotelProvider, 40, 12, 100, true));
            }
        };
    }
}
